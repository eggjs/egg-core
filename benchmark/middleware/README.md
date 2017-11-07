
**Please run benchmark with node 7+ for async await support.**

## Benchmark Result

```sh
v8.9.0
server started at 7001
------- generator middleware -------
["generator middleware #1","generator middleware #2","generator middleware #3","generator middleware #4","generator middleware #5","generator middleware #6","generator middleware #7","generator middleware #8","generator middleware #9","generator middleware #10","generator middleware #11","generator middleware #12","generator middleware #13","generator middleware #14","generator middleware #15","generator middleware #16","generator middleware #17","generator middleware #18","generator middleware #19","generator middleware #20"]
Running 10s test @ http://127.0.0.1:7001/generator
  8 threads and 50 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency     8.41ms    2.16ms  23.98ms   81.95%
    Req/Sec   740.78    118.95     0.94k    65.72%
  56808 requests in 10.00s, 41.69MB read
Requests/sec:   5682.76
Transfer/sec:      4.17MB
------- async middleware -------
["async middleware #1","async middleware #2","async middleware #3","async middleware #4","async middleware #5","async middleware #6","async middleware #7","async middleware #8","async middleware #9","async middleware #10","async middleware #11","async middleware #12","async middleware #13","async middleware #14","async middleware #15","async middleware #16","async middleware #17","async middleware #18","async middleware #19","async middleware #20"]
Running 10s test @ http://127.0.0.1:7001/async
  8 threads and 50 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency     5.90ms    1.28ms  18.68ms   90.46%
    Req/Sec     1.07k   138.46     1.47k    82.79%
  82023 requests in 10.00s, 54.40MB read
Requests/sec:   8202.83
Transfer/sec:      5.44MB
```
