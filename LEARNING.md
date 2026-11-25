# Learning aMAZE!

## Matrix coordinates and defensive copies

A grid is an array of rows. Position `{ x: 3, y: 1 }` means column 3 in row 1, so access uses `grid[1][3]`. Screen coordinates increase downward. Bounds checks prevent invalid reads. This is constant time per lookup. Copying the grid for a snapshot takes O(width × height) time and space. A shared immutable grid could remove the recurring copy but would need stronger guarantees about ownership.

## State machines and composition

The engine owns the game lifecycle. For example, a move while paused cannot reach the Player instance, so it cannot increment collisions. Player delegates walkability to Maze, and the application reads a snapshot after issuing a command. This keeps the rules testable without a browser. An event reducer could represent these same transitions, at the cost of passing a larger immutable state object through each operation.

## DFS and seeded generation

Think of the odd-coordinate cells as graph vertices. DFS chooses an unvisited neighbor two tiles away, opens the wall between them, and pushes the neighbor. When a vertex runs out of neighbors the stack pops back to a previous branch. Each carve connects a new vertex to the existing tree, so every room is reachable and there is exactly one route between rooms. A seed makes the sequence repeatable. Time and memory are O(width × height). A recursive implementation is shorter but risks overflowing the call stack.

## BFS and topology

BFS visits cells in order of distance using a queue. If the exit is first reached after four edges, no shorter route exists. Parent indices recover that route and the same traversal measures reachable area. Time and space are O(width × height). A* can search fewer cells when only a route is needed, but BFS also provides exhaustive reachability. Junction and dead-end counts describe geometry. How hard the maze feels also depends on the player.

## Gameplay events and feature engineering

A movement event records the source, attempted direction, destination, outcome, timestamp, and session/level identifiers. A collision must leave the coordinates unchanged. Enrichment attaches properties such as revisiting a cell or entering a dead end. This lets a session count collisions without saving every input indefinitely. For example, two collisions and eight successful moves imply a collision rate of 2/10. Events append to a ring buffer in O(1) time and O(capacity) space. A visited set grows with the reachable area, and aggregate counters are independent of the raw history window. An event log on a server could support more analysis but would increase privacy, storage, and operating costs.

## Conditional probabilities and online learning

A Markov row describes the next junction decision given the previous junction decision. If the player chose left three times and right once after a previous straight decision, add-one smoothing gives weights 4 and 2. If those are the only legal options, their probabilities are 4/6 and 2/6. The game evaluates its prediction before adding the actual turn to the row. This avoids training on the event being scored. Sparse rows back off to marginal counts, and the model abstains when evidence is weak. Counting and prediction are O(1) with four relative directions. A higher-order Markov model can capture longer patterns but needs more observations per context.

## Search, scoring, and feedback

The adaptive generator samples nine seeded DFS layouts and measures each with BFS and topology scans. A targeted route length, dead-end penalty, and score for demanding unexpected decisions determine the winner. For a player with frequent revisits, dead ends cost more when comparing candidates. The candidate search costs O(k × width × height) time and space for k retained candidates. Sampling explores different layouts while scoring exploits the available observations. Varying layouts with measured constraints keeps feedback between runs and stops any intervention during play. A fully optimized maze search could be more expensive and less transparent.

## Persistence and storage boundaries

Serialization converts the profile to JSON. A version marker, type checks, and a size limit let the browser reject corrupted or unsupported data. For instance, a profile with a negative difficulty cannot affect candidate selection. Loading and saving take O(serialized profile size). A browser database could store larger event histories or support indexed queries, but the compact aggregate profile fits LocalStorage and needs no backend.

## React, browser events, and Canvas

The hook owns an experiment instance and translates commands into updated state for React. Keyboard listeners are active only in a playing experiment and are removed by effect cleanup. The Canvas effect uses the snapshot to redraw after movement or resizing. A cell at (2, 3) starts at (2 × cellSize, 3 × cellSize) in logical pixels. A 300-pixel canvas at 3× density uses a 900-pixel backing store. Redraw is O(width × height), and the backing buffer grows with the square of device pixel ratio. A retained DOM tile grid could expose each cell to assistive technology but would need separate rendering and layout tradeoffs.

## Companion dialogue and progression

The experiment maps outcomes to dialogue signals, and the dialogue engine picks from authored variations with a cooldown. For example, repeated wall hits can prompt a suggestion to try another direction. Transition outcomes drive the message selection in constant time. Progression uses explicit stage gates and the profile carries unlocked stages across visits. Difficulty adjusts by at most 0.5 after crediting an eligible run, which limits the effect of one unusual performance.

The Canvas rasterizes the static tile layer once per mounted chamber. Foreground frames reuse that prepainted layer while animating the astronaut and airlock. This avoids recomputing tile details per move but still copies the frame for display.
