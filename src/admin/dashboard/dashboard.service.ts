/*
https://docs.nestjs.com/providers#services
*/

import { Injectable } from '@nestjs/common';
import { ReturnModelType } from '@typegoose/typegoose';
import dayjs from 'dayjs';
import { InjectModel } from 'nestjs-typegoose';
import { OrderModel } from '../../models/admin/order.model';
import { AppUserModel } from '../../models/app/user.model';
@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(OrderModel)
    private readonly orderModel: ReturnModelType<typeof OrderModel>,
    @InjectModel(AppUserModel)
    private readonly userModel: ReturnModelType<typeof AppUserModel>,
  ) { }
  //合并数组
  public concatArr(arr: any) {
    const total = arr.map((item) => {
      return item.total;
    });
    const time = arr.map((item) => {
      return item._id;
    });
    return {
      total: total,
      time: time,
    };
  }
  // 对象云重
  //数组对象去重
  public getArrReduce(arr: any) {
    const allArr = [];
    for (let i = 0; i < arr.length; i++) {
      let flag = true;
      for (var j = 0; j < allArr.length; j++) {
        if (arr[i]._id == allArr[j]._id) {
          flag = false;
        }
      }
      if (flag) {
        allArr.push(arr[i]);
      }
    }
    return allArr.sort(this.sortArr('_id'));
  }
  //对数组对象进行排序
  public sortArr(prop: string) {
    return function (obj1: { [x: string]: any; }, obj2: { [x: string]: any; }) {
      var val1 = obj1[prop];
      var val2 = obj2[prop];
      if (val1 < val2) {
        return -1;
      } else if (val1 > val2) {
        return 1;
      } else {
        return 0;
      }
    };
  }
  // 获取当前时间前7天的数组
  get7dayArr() {
    let now: any = new Date();
    const s = [];
    let i = 0;
    while (i < 7) {
      let Day = now.getDate() < 10 ? '0' + now.getDate() : now.getDate();
      let Month =
        now.getMonth() + 1 < 10
          ? '0' + (now.getMonth() + 1)
          : now.getMonth() + 1;
      s.push({ _id: now.getFullYear() + '-' + Month + '-' + Day, total: 0 });
      now = new Date(now - 24 * 60 * 60 * 1000);
      i++;
    }
    return s;
  }
  // 控制台查询数据
  async query() {
    const curDate = dayjs(new Date()).format('YYYY-MM-DD');
    const startTime = curDate + ' 00:00:00';
    const endTime = curDate + ' 23:59:59';
    const day_Time = dayjs(new Date()).subtract(7, 'day').format('YYYY-MM-DD');
    const yesterday_time = dayjs(new Date()).subtract(1, 'day').format('YYYY-MM-DD');;
    const _arr = this.get7dayArr();
    // console.log('startTime', startTime);
    // console.log('endTime', endTime);
    // console.log('day_Time', day_Time);
    // console.log('yesterday_time', yesterday_time);
    const Amount = 0;
    //订单总额status
    const TotalAmount = await this.orderModel.aggregate([
      {
        $lookup:
        {
          from: "j_price",
          localField: "product_code",
          foreignField: "_id",
          as: "priceInfo"
        }
      },
      { $unwind: "$priceInfo" }, // 将数组转为为每个文档
      {
        $match: {
          $and: [{ status: 'PAY_SUCCESS' }],
        },
      },
      {
        $project: {
          _id: 0,
          day: { $substr: ['$createdAt', 0, 10] },
          priceInfo: 1
        },
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$priceInfo.payment_price' }
        }
      },

    ]);
    //今日订单总额
    const dayTotalAmount = await this.orderModel.aggregate([
      {
        $lookup:
        {
          from: "j_price",
          localField: "product_code",
          foreignField: "_id",
          as: "priceInfo"
        }
      },
      { $unwind: "$priceInfo" }, // 将数组转为为每个文档
      {
        $match: {
          $and: [
            {
              createdAt: { $gte: new Date(startTime), $lte: new Date(endTime) },
              status: 'PAY_SUCCESS',
            },
          ],
        },
      },
      {
        $project: {
          _id: 0,
          day: { $substr: ['$createdAt', 0, 10] },
          priceInfo: 1
        },
      },
      { $group: { _id: null, totalAmount: { $sum: '$priceInfo.payment_price' } } },
    ]);
    //昨日订单总额
    const YesterdayTotalAmount = await this.orderModel.aggregate([
      {
        $lookup:
        {
          from: "j_price",
          localField: "product_code",
          foreignField: "_id",
          as: "priceInfo"
        }
      },
      { $unwind: "$priceInfo" }, // 将数组转为为每个文档
      {
        $match: {
          $and: [
            {
              createdAt: {
                $gte: new Date(yesterday_time + ' 00:00:00'),
                $lte: new Date(yesterday_time + ' 23:59:59'),
              },
              status: 'PAY_SUCCESS',
            },
          ],
        },
      },
      {
        $project: {
          _id: 0,
          day: { $substr: ['$createdAt', 0, 10] },
          priceInfo: 1
        },
      },
      { $group: { _id: null, totalAmount: { $sum: '$priceInfo.payment_price' } } },
    ]);
    //未付款
    const w_total = await this.orderModel.find({ status: 10 }).count();
    //已发货
    const s_total = await this.orderModel.find({ status: 20 }).count();
    //未发货
    const y_total = await this.orderModel.find({ status: 30 }).count();
    //已发货
    const f_total = await this.orderModel.find({ status: 40 }).count();
    //总用户数
    const UserCount = await this.userModel.find().count();
    //今日新增用户
    const DayAddUserCount = await this.userModel.find({
      createdAt: { $gte: new Date(startTime), $lte: new Date(endTime) },
    }).count();
    //七日订单数据
    const day_total = await this.orderModel.aggregate([
      {
        $lookup:
        {
          from: "j_price",
          localField: "product_code",
          foreignField: "_id",
          as: "priceInfo"
        }
      },
      { $unwind: "$priceInfo" }, // 将数组转为为每个文档
      {
        $match: {
          $and: [
            {
              createdAt: {
                $gte: new Date(day_Time), // 当前时间减7天为初始值
                $lte: new Date(curDate), // 当前时间
              },
              status: 'PAY_SUCCESS',
            },
          ],
        },
      },
      {
        $project: {
          _id: 0,
          day: { $substr: ['$createdAt', 0, 10] },
          priceInfo: 1,
        },
      },
      { $group: { _id: '$day', total: { $sum: '$priceInfo.payment_price' } } },
      { $sort: { createdAt: -1 } },
    ]);
    day_total.map((item) => {
      item.total = item.total / 100
      return item
    })
    //用户七日数据
    const user_day = await this.userModel.aggregate([
      {
        $match: {
          $and: [
            {
              createdAt: {
                $gte: new Date(day_Time),
                $lte: new Date(curDate),
              },
            },
          ],
        },
      },
      { $project: { _id: 0, day: { $substr: ['$createdAt', 0, 10] } } },
      { $group: { _id: '$day', total: { $sum: 1 } } },
      { $sort: { createdAt: -1 } },
    ]);
    let _user_day_total = user_day.concat(_arr); //合并数组
    let _day_total = day_total.concat(_arr); //合并数组
    if (
      dayTotalAmount ||
      YesterdayTotalAmount ||
      UserCount ||
      DayAddUserCount ||
      _user_day_total ||
      _day_total
    ) {
      return {
        orderState: {
          s: s_total || 0,
          w: w_total || 0,
          y: y_total || 0,
          f: f_total || 0,
        },
        user: {
          count: UserCount,
          add: DayAddUserCount,
        },
        userData: this.concatArr(this.getArrReduce(_user_day_total)),
        orderData: this.concatArr(this.getArrReduce(_day_total)),
        totalAmount: {
          total: (TotalAmount[0] && TotalAmount[0].totalAmount) / 100 || 0,
          day: (dayTotalAmount[0] && dayTotalAmount[0].totalAmount) / 100 || 0,
          yesterday:
            (YesterdayTotalAmount[0] &&
              YesterdayTotalAmount[0].totalAmount) / 100 ||
            0,
        }
      };
    }
  }
}
