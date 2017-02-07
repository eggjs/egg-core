
## Benchmark Result

```
v7.4.0
server started at 7001
------- generator middleware -------
["generator middleware #1","generator middleware #2","generator middleware #3","generator middleware #4","generator middleware #5","generator middleware #6","generator middleware #7","generator middleware #8","generator middleware #9","generator middleware #10","generator middleware #11","generator middleware #12","generator middleware #13","generator middleware #14","generator middleware #15","generator middleware #16","generator middleware #17","generator middleware #18","generator middleware #19","generator middleware #20"]
Running 10s test @ http://127.0.0.1:7001/generator
  8 threads and 50 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency     8.59ms    1.36ms  24.79ms   91.34%
    Req/Sec   715.17     71.07   848.00     80.98%
  55644 requests in 10.00s, 40.81MB read
Requests/sec:   5564.89
Transfer/sec:      4.08MB
------- async middleware -------
["async middleware #1","async middleware #2","async middleware #3","async middleware #4","async middleware #5","async middleware #6","async middleware #7","async middleware #8","async middleware #9","async middleware #10","async middleware #11","async middleware #12","async middleware #13","async middleware #14","async middleware #15","async middleware #16","async middleware #17","async middleware #18","async middleware #19","async middleware #20"]
Running 10s test @ http://127.0.0.1:7001/async
  8 threads and 50 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency    14.39ms    1.61ms  30.73ms   93.22%
    Req/Sec   425.00     33.35   533.00     68.54%
  33427 requests in 10.00s, 21.86MB read
Requests/sec:   3342.23
Transfer/sec:      2.19MB
```
