# Goal

Create an algorithm that allows conflict-free error-recoverable synchronization between a history-less IndexDB store and a Git branch that is backed by aremote.

1. Git remote is eventually consistent with changes made in IndexDB.
2. IndexDB is eventually consistent with changes made in Git remote.
3. Changes made IndexDB will always override changes made in Git remote, when any of these conficts arises:
   1. A record is modified in IndexDB, but is simultaneously deleted in Git remote, the modified record will be restored upon sync.
   2. A record is modified in IndexDB, but is simultaneously modified in Git remote, the IndexDB version will override the Git remote version upon sync.
   3. A record is deleted in IndexDB, but is simultaneously modified in Git remote, the record will be deleted upon sync.
4. Human errors may lead to the second and third conflict case, which lead to data loss. An undo command should be used to help user recover from such mistakes.

# Notations

## Git branches

Consider Git branch `B` as series of commits. `B_1_n` representing the entire history of the branch, from Commit `1` to Commit `n`.

```
B_1_n = [C_1, C_2, C_3, ... C_n]
```

There exists a function `BranchToPartial()` for `B_1_n` that takes a any sub-sequence `[C_i...C_j] | 1 <= i && j <= n` and generate Partial `P_i_j`.

```
P_i_j <- BranchToPartial(C_i...C_j)
```

Two Partials are contiguous when the their beginning commits are in order; and their ending commits are in order; and the beginning commit of the 2nd partial leaves no gap after the ending commit of the 1st Partial. Note that two contiguous Partials may have overlapping commits.

```
P_i_j and P_t_k are contigous when i <= t AND j <= k AND t <= j + 1
```

There also exists a function `PartialsToState()` that converts a series of contiguous partials `[P_1_k...P_j_n]` to the entire State of the branch `S_1_n`

```
State of B_1_n = S_1_n <- PartialsToState(P_1_k...P_j_n) where all the Partials are contingous
```

Partial allows us to convert Branch to State in a conflict-free, error-tolerant way.

Finally, we have a named branch `GitL_1_n` to represent the local branch with commits `1` to `n`, and branch `GitR_1_n` to represent the remote branch with commits `1` to `n`.

## State

Let `SS` stands for Syncable State. State is collection of records, each has a binary flag, indicated whether the record is `synced` or `unsynced`. Formally

```
∀ r ∈ SS | r.synced ∈ {True, False}
```

We can partition `SS` into synced State and unsynced State. The synced State can be reduced from Partials.

```
SS_synced ⊆ SS and ∀ r ∈ SS_synced | r.synced = true
SS_unsynced ⊆ SS and ∀ r ∈ SS_unsynced | r.synced = false

SS_synced = PartialsToState(P_1_k)
SS = PartialsToState(SS_synced, SS_unsynced)
```

In addition, a function `Commit()` converts the unsynced state back to a Partial and Commit pair. Formally

```
SS_synced = PartialsToState(P_1_k)

(C_k+1, P_k+1) <- Commit(SS_unsynced) where
P_k+1 = BranchToPartial(C_k+1)

SS = PartialsToState(SS_synced, PartialToState(P_k+1))
```

The Commit function allows us to capture the changes from a freely mutated a state into version tracked branch

## Pointers

Let `PS` denote a pointer to the last commit that the State is reduced from. Let `PR` denote the last commit of a git branch

```
PS points to C_n in B_1_n where SS_1_n = PartialsToState(P_1_k...P_j_n)
PR points to C_n in B_1_n
```

Pointers allow us to recover from failures.

# Algorithm
