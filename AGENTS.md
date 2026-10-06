# Repo Analysis Tool (RAT)

Measures the metrics of a repo(s).

The RAT should be a webapp dashboard for multiple repos with the ability to filter based on repo, author, file/directory, and commits (a specified period or list of commits)

The metrics measured are given below:
* File Metrics
* Directory Metrics
* Repo Metrics
* Commit Set Metrics

Repos can be given as zips or a remote url (that should be clonable).

## Metrics

### File Metrics

* File added lines: no. lines added from file f from commit h to previous commit h(p)
* File removed lines: no. lines removed from file f from commit h to prev
* File growth: change in no. lines (added - removed)
* File churn: no. of changed lines on file f (added + removed)

### Directory Metrics

An immediate object is an object that is directly below the specified directory
foo/
	bar.txt -- immediate child of foo
	baz/ -- immediate child of foo
		beef.py -- immediate child of baz
		dead.py -- immediate child of baz
A file f is in a directory d at a commit ℎ if it is in ℎ[𝐹] or ℎ[𝑝][𝐹] (where h[p] is the prev commit) and is an immediate child of d.
Similarly for subdirectories d′ and ℎ[𝐷], ℎ[𝑝][𝐷].
* Directory Added Lines: The number of added lines across all immediate subdirectories d′ and files f in directory d
* Directory Removed Lines: The number of removed lines across all immediate subdirectories d′ and files f in directory d
* Directory Growth: The net growth across all immediate subdirectories d′ and files f in directory d
* Directory Churn: The churn across all immediate subdirectories d′ and files f in directory d

### Repo Metrics

Repository metrics are directory metrics on the root of the commit tree.

### Commit Set Metrics

* Added lines over a commit set 𝐻 in either a directory or file
* Removed lines over a commit set 𝐻 in either a directory or file
* Growth over a commit set 𝐻 in either a directory or file
* Churn over a commit set 𝐻 in either a directory or file
* Modifications: The number of commits that have at least some change on file or directory 
* Modification frequency over a file or directory
* Churn rate over a file or directory


## Note

The repo must contain a README with instructions on how to run your submission. This should be in the form of commands to run such as `npm install` and `npm run dev`.

**No More UI Tests Carried Out By Yourself**
