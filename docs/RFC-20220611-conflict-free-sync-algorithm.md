# Goal

Create an algorithm that allows conflict-free error-recoverable synchronization between a history-less IndexDB store and a Git branch that is backed by a remote.

1. Git remote is eventually consistent with changes made in IndexDB.
2. IndexDB is eventually consistent with changes made in Git remote.
3. Changes made IndexDB will always override changes made in Git remote, when any of these conficts arises:
   1. A record is modified in IndexDB, but is simultaneously deleted in Git remote, the modified record will be restored upon sync.
   2. A record is modified in IndexDB, but is simultaneously modified in Git remote, the IndexDB version will override the Git remote version upon sync.
   3. A record is deleted in IndexDB, but is simultaneously modified in Git remote, the record will be deleted upon sync.
4. Human errors may lead to the second and third conflict case, which lead to data loss. An undo command should be used to help user recover from such mistakes.

# Notations

## Git branches

Consider Git branch `B` as series of commits. `B_1..n` representing the entire history of the branch, from Commit `1` to Commit `n`.

```
B_1..n = [C_1, C_2, C_3, ... C_n]
```

There exists a function `CommitsToPartial()` for `B_1..n` that takes a any sub-sequence `[C_i ... C_j] | 1 <= i && j <= n` and generate Partial `P_i..j`.

```
P_i..j <- CommitsToPartial(C_i ... C_j)
```

Two Partials are contiguous when the their beginning commits are in order; and their ending commits are in order; and the beginning commit of the 2nd partial leaves no gap after the ending commit of the 1st Partial. Note that two contiguous Partials may have overlapping commits.

```
P_i..j and P_t..k are contigous when i <= t AND j <= k AND t <= j + 1
```

There also exists a function `PartialsToState()` that converts a series of contiguous partials `[P_1..k ... P_j..n]` to the entire State of the branch `S_1..n`

```
State of B_1..n = S_1..n <- PartialsToState(P_1..k ... P_j..n) where all the Partials are contingous
```

Partial allows us to convert Branch to State in a conflict-free, error-tolerant way.

Finally, we have a named branch `GitL_1..n` to represent the local branch with commits `1` to `n`, and branch `GitR_1..n` to represent the remote branch with commits `1` to `n`.

## State

Let `SS` stands for Syncable State. State is collection of records, each has a binary flag, indicated whether the record is `synced` or `unsynced`. Formally

```
∀ r ∈ SS | r.synced ∈ {True, False}
```

We can partition `SS` into synced State and unsynced State. The synced State can be reduced from Partials.

```
SS_synced ⊆ SS and ∀ r ∈ SS_synced | r.synced = true
SS_unsynced ⊆ SS and ∀ r ∈ SS_unsynced | r.synced = false

SS_synced = PartialsToState(P_1..k)
SS = PartialsToState(SS_synced, SS_unsynced)
```

In addition, a function `Commit()` converts the unsynced state back to a Partial and Commit pair. Formally

```
SS_synced = PartialsToState(P_1..k)

(C_k+1, P_k+1) <- Commit(SS_unsynced) where P_k+1 = CommitsToPartial(C_k+1)

SS = PartialsToState(SS_synced, PartialToState(P_k+1))
```

The Commit function allows us to capture the changes from a freely mutated a state into version tracked branch

## Pointers

Let `PS` denote a pointer to the last commit that the State is reduced from. Let `PB` denote the last commit of a git branch

```
PS points to C_n in B_1..n where SS_1..n = PartialsToState(P_1..k ... P_j..n)
PB points to C_n in B_1..n
```

Pointers allow us to recover from failures during State mutation.

# Algorithm

Assumptions:

1. Local history is compatible with remote history, i.e. the remote commit series can only append after local commit series.
   ```
    We have GitL_1..k and GitR_1..k+i where i >= 0
   ```
2. The pointers are valid and collapsed.
   ```
    PS == PB == C_k where C_k is the latest commit in GitL_1..k
   ```

Steps:

1. If `PS != PB` goto Step 6.2
2. PULL
   1. Set local branch to be identical to remote branch `GitL_1..k+i <- GitR_1..k+i` where `i >=0`
   2. On failure, restart from Step 1
3. If `SS_unsynced` is empty, goto Step 6
4. COMMIT
   1. Set `(C_k+i+1, P_k+i+1) <- Commit(SS_unsynced)`
   2. Append `C_k+i+1` to `GitL_1..k+i` to get `GitL_1..k+i+1`
   3. On failure from either step, restart from Step 1
5. PUSH
   1. Try append `C_k+i+1` to remote
   2. If remote did not change since step 3, it becomes `GitR_1..k+i+1`
   3. If remote changed since step 3, confict happens, restart from Step 1
   4. On failure from any step, restart from Step 1
6. DIGEST
   1. Set `PB <- C_latest`
   2. Set `StateChangePartial <- CommitsToPartial(C_PS..C_PB)`
   3. Set `SS <- PartialsToState(SS_synced, StateChangePartial)`
      1. For each changed record, set its `synced` flag to `True` during mutation
   4. Set `PS <- PB`
   5. On failure from any step, restart from Step 1
   6. EXIT

# Appendix

- In `SS`, deleted records are represented by tombstone. They are removed during Step 6 DIGEST
- When `PS != PB`, `SS` should not be mutated outside of the sync algorithm
- When failure happens during user interaction, prompt error, and allow user to retry
- When failure happens due to abrupt shutdown, the algorithm can be rerun from start without unwanted side effect
