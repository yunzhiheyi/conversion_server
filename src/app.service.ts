import { Injectable } from '@nestjs/common';
// import { CacheService } from './utils/redis.service'
@Injectable()
export class AppService {
  constructor() {

  }
}

class customFun {
  data: Array<string>;
  cache: Array<string>;
  constructor(data: any) {
    this.data = data;
  }
  format(data) {
    // 处理其他逻辑
    console.log('参数', data);
    this.cache = this.data.map((item: string) => {
      var datatime: string = item.replace(/..(\d{4}).(\d{1,2}).(\d{1,2}).+/gm, "$1-$2-$3");
      return datatime;
    });
    return this;
  }
  otherFun(data: string) {
    // 处理其他逻辑
    console.log('参数', data);
    this.cache.map((item: any) => {
      // 处理其他逻辑
      console.log('处理其他逻辑', item);
    });
    return this;
  }
  validSubarrays(nums: Array<number>) {
    if (nums.length == 1) return 1;
    var sum = nums.length;  // 每一个元素单独成为子数组，也是有效子数组
    var dp: Array<number> = [nums.length];
    // dp[i] = j 表示 [i,j] 是一个有效子数组
    // 从倒数第一个到第0个遍历
    for (var i = nums.length - 2; i >= 0; i--) {
      for (var j = i + 1; j < nums.length; j++) {
        if (nums[i] <= nums[j]) {
          //这一步是优化点：可以少遍历一些
          if (dp[j] != 0) j = dp[j];
          dp[i] = j;
        } else {
          break;
        }
      }
      if (dp[i] != 0) sum += dp[i] - i;
    }
    return sum;
  }
}
var customDate = (data: any) => {
  return new customFun(data);
};
// customDate(["正常2020年10月1日在在日日日", "正常2022年10月10日在在"]).format('yyyy-mm-dd').otherFun('data');

var validSubarrays = (nums: Array<number>) => {
  if (nums.length == 1) return 1;
  var sum = nums.length;
  var dp = [0, 1, 2];
  console.log('1')
  for (var i = nums.length - 2; i >= 0; i--) {
    for (var j = i + 1; j < nums.length; j++) {
      if (nums[i] <= nums[j]) {
        if (dp[j] != 0) j = dp[j];
        dp[i] = j;
      } else {
        break;
      }
    }
    if (dp[i] != 0) sum += dp[i] - i;
  }
  return sum;
}

var arr = [2, 2, 2];
var num = validSubarrays(arr);
console.log('num____' + num);
var foo = { week: 45, transport: "car", month: 7 }
console.log(JSON.stringify(foo, ["week", "month"]))