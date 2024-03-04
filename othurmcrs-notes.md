# Principles of smart contract design

- Less Code
- Picky about storage variables ( at best inefficient, at worst lead to crtical bug due to mismatch of state )
  - Ideally no Parallel Data Structures!
- Unneccesary logic should happen off chain (frontend)
- For loops should be rare
- Unexpected in = unexpected out | Cut out unexpected paths
- handle all cases
- External Calls
  - Reentrancy | CEI, nonReentrant, Multi contract, read only
  - DoS | Fail
  - Return Values | Checked for all pos values, Unexpected bytes
  - Gas | If not trusted = dont forward all gas
- Post Checks | Bal > X

## Mission 1 should be done in ~200sloc

#

https://youtu.be/DRZogmD647U?t=5784
