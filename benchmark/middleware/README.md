
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
    Latency     7.35ms    1.76ms  26.71ms   89.82%
    Req/Sec   835.10     90.14     1.00k    77.15%
  64366 requests in 10.00s, 47.37MB read
Requests/sec:   6436.48
Transfer/sec:      4.74MB
------- async middleware -------
["async middleware #1","async middleware #2","async middleware #3","async middleware #4","async middleware #5","async middleware #6","async middleware #7","async middleware #8","async middleware #9","async middleware #10","async middleware #11","async middleware #12","async middleware #13","async middleware #14","async middleware #15","async middleware #16","async middleware #17","async middleware #18","async middleware #19","async middleware #20"]
Running 10s test @ http://127.0.0.1:7001/async
  8 threads and 50 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency     5.35ms    1.27ms  20.44ms   92.48%
    Req/Sec     1.18k   157.98     1.57k    75.69%
  90415 requests in 10.00s, 60.08MB read
Requests/sec:   9040.45
Transfer/sec:      6.01MB
```

![](https://user-images.githubusercontent.com/985607/32474444-2f4b7cde-c332-11e7-923f-8dfb709a7a24.png)

### 2022-12-06

Enable asyncLocalStorage

```
v18.12.1
server started at 7001
------- generator middleware -------
["generator middleware #1","generator middleware #2","generator middleware #3","generator middleware #4","generator middleware #5","generator middleware #6","generator middleware #7","generator middleware #8","generator middleware #9","generator middleware #10","generator middleware #11","generator middleware #12","generator middleware #13","generator middleware #14","generator middleware #15","generator middleware #16","generator middleware #17","generator middleware #18","generator middleware #19","generator middleware #20"]
Running 10s test @ http://127.0.0.1:7001/generator
  8 threads and 50 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency     2.42ms  584.46us  12.20ms   94.43%
    Req/Sec     2.50k   601.24    18.36k    97.63%
  198950 requests in 10.10s, 153.00MB read
Requests/sec:  19699.09
Transfer/sec:     15.15MB
------- async middleware -------
["async middleware #1","async middleware #2","async middleware #3","async middleware #4","async middleware #5","async middleware #6","async middleware #7","async middleware #8","async middleware #9","async middleware #10","async middleware #11","async middleware #12","async middleware #13","async middleware #14","async middleware #15","async middleware #16","async middleware #17","async middleware #18","async middleware #19","async middleware #20"]
Running 10s test @ http://127.0.0.1:7001/async
  8 threads and 50 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency     1.97ms    1.58ms  43.26ms   96.10%
    Req/Sec     3.23k     0.86k   24.84k    95.38%
  257959 requests in 10.10s, 179.02MB read
Requests/sec:  25533.50
Transfer/sec:     17.72MB
```

Disable asyncLocalStorage

```
v18.12.1
server started at 7001
------- generator middleware -------
["generator middleware #1","generator middleware #2","generator middleware #3","generator middleware #4","generator middleware #5","generator middleware #6","generator middleware #7","generator middleware #8","generator middleware #9","generator middleware #10","generator middleware #11","generator middleware #12","generator middleware #13","generator middleware #14","generator middleware #15","generator middleware #16","generator middleware #17","generator middleware #18","generator middleware #19","generator middleware #20"]
Running 10s test @ http://127.0.0.1:7001/generator
  8 threads and 50 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency     2.22ms    1.18ms  38.70ms   93.88%
    Req/Sec     2.79k   361.32     3.27k    85.50%
  222356 requests in 10.01s, 171.13MB read
Requests/sec:  22208.19
Transfer/sec:     17.09MB
------- async middleware -------
["async middleware #1","async middleware #2","async middleware #3","async middleware #4","async middleware #5","async middleware #6","async middleware #7","async middleware #8","async middleware #9","async middleware #10","async middleware #11","async middleware #12","async middleware #13","async middleware #14","async middleware #15","async middleware #16","async middleware #17","async middleware #18","async middleware #19","async middleware #20"]
Running 10s test @ http://127.0.0.1:7001/async
  8 threads and 50 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency     1.71ms    0.98ms  33.63ms   94.19%
    Req/Sec     3.60k   511.38    10.65k    91.28%
  288119 requests in 10.10s, 200.07MB read
Requests/sec:  28513.37
Transfer/sec:     19.80MB
```
