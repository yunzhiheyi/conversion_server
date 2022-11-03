import { IsNotEmpty, IsEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
// 后台帐号
export class aUserDto {
  @ApiProperty({ description: '帐号', example: 'admin' })
  @IsNotEmpty()
  readonly username: string;

  @ApiProperty({ description: '密码', example: '123456' })
  @IsNotEmpty()
  readonly password: string;

  @ApiProperty({ description: '验证码', example: '111111' })
  @IsNotEmpty()
  readonly verifyCode: string;
}
// 分页
export class pagesDto {
  @ApiProperty({ description: '分类条数', example: '10' })
  @IsNotEmpty()
  readonly pageSize: number;

  @ApiProperty({ description: '当前页码', example: '1' })
  @IsNotEmpty()
  readonly current: number;

  @ApiProperty({ description: '搜索内容', example: '1' })
  @IsNotEmpty()
  readonly keyword: string;

  @ApiProperty({ description: '状态', example: '1' })
  @IsNotEmpty()
  readonly status: string;

  @ApiProperty({ description: '用户ID', example: '1' })
  readonly user_id: string;

  @ApiProperty({ description: '被邀请码', example: '1' })
  readonly invitee_code: string;

}

export class KaolaBody {
  @ApiProperty({ description: 'communityIds' })
  @IsEmpty()
  readonly communityIds: [];

  @ApiProperty({ description: 'accountId' })
  @IsEmpty()
  readonly accountId: number;

  @ApiProperty({ description: 'account_id' })
  @IsEmpty()
  readonly account_id: string;

  @ApiProperty({ description: '_id' })
  @IsEmpty()
  readonly _id: string;
}

// kaola 数据库 小区
export class KaolaCommunityBody {
  @ApiProperty({ description: 'add_detail' })
  @IsNotEmpty()
  readonly add_detail: string;

  @ApiProperty({ description: 'add_post' })
  @IsNotEmpty()
  readonly add_post: string;

  @ApiProperty({ description: 'add_one' })
  @IsNotEmpty()
  readonly add_one: number;

  @ApiProperty({ description: 'add_three' })
  @IsNotEmpty()
  readonly add_three: number;

  @ApiProperty({ description: 'add_two' })
  @IsNotEmpty()
  readonly add_two: number;

  @ApiProperty({ description: 'architect' })
  @IsNotEmpty()
  readonly architect: string;

  @ApiProperty({ description: 'bulid_year' })
  @IsNotEmpty()
  readonly bulid_year: string;

  @ApiProperty({ description: 'buliding_pic' })
  @IsEmpty()
  readonly buliding_pic: [];

  @ApiProperty({ description: 'buliding_video' })
  @IsEmpty()
  readonly buliding_video: [];

  @ApiProperty({ description: 'community_name' })
  @IsNotEmpty()
  readonly community_name: string;

  @ApiProperty({ description: 'community_setting' })
  @IsEmpty()
  readonly community_setting: [];

  @ApiProperty({ description: 'floor_size' })
  @IsEmpty()
  readonly floor_size: number;

  @ApiProperty({ description: 'household' })
  @IsEmpty()
  readonly household: number;

  @ApiProperty({ description: 'layout_pic' })
  @IsEmpty()
  readonly layout_pic: string;

  @ApiProperty({ description: 'loc_lat' })
  @IsNotEmpty()
  readonly loc_lat: number;

  @ApiProperty({ description: 'loc_lng' })
  @IsNotEmpty()
  readonly loc_lng: number;

  @ApiProperty({ description: 'mangement_pic' })
  @IsEmpty()
  readonly mangement_pic: [];

  @ApiProperty({ description: 'mangement_video' })
  @IsEmpty()
  readonly mangement_video: [];

  @ApiProperty({ description: 'setting_pic' })
  @IsEmpty()
  readonly setting_pic: [];

  @ApiProperty({ description: 'setting_video' })
  @IsEmpty()
  readonly setting_video: [];

  @ApiProperty({ description: 'spider_community_id' })
  @IsEmpty()
  readonly spider_community_id: string;

  @ApiProperty({ description: 'surrounding_pic' })
  @IsEmpty()
  readonly surrounding_pic: [];

  @ApiProperty({ description: 'surrounding_video' })
  @IsEmpty()
  readonly surrounding_video: [];

  @ApiProperty({ description: 'tenure' })
  @IsNotEmpty()
  readonly tenure: number;

  @ApiProperty({ description: 'type_one' })
  @IsNotEmpty()
  readonly type_one: number;

  @ApiProperty({ description: 'type_two' })
  @IsNotEmpty()
  readonly type_two: number;

  @ApiProperty({ description: 'type_three' })
  @IsNotEmpty()
  readonly type_three: number;

}
// 用户信息
export class InfoDto {
  @ApiProperty({ description: '用户ID', example: '1' })
  @IsNotEmpty()
  readonly uid: string;
}
// 按钮提交
export class btnAddEditDto {
  @ApiProperty({ description: '菜单名' })
  @IsNotEmpty()
  readonly btnName: string;

  @ApiProperty({ description: ' 按钮标识', required: true })
  @IsNotEmpty()
  readonly btnId: string;

  @ApiProperty({ description: ' 按钮锁', required: true })
  @IsNotEmpty()
  readonly isLock: Boolean;

  @ApiProperty({ description: ' 当前按钮的权限菜单ID', required: true })
  @IsNotEmpty()
  readonly menuId: string;
}

// 数组ID
export class IdsDto {
  @ApiProperty({ description: '数组ID' })
  @IsNotEmpty()
  readonly id: [];
}

// 菜单ID
export class housingIdDto {
  @ApiProperty({ description: 'ID' })
  @IsNotEmpty()
  readonly id: string;
  @ApiProperty({ description: '房源类型' })
  @IsNotEmpty()
  readonly house_classify: string;
}

// 菜单ID
export class IdDto {
  @ApiProperty({ description: 'ID' })
  @IsNotEmpty()
  readonly id: string;
}

//文件删除
export class fileDeleteDto {
  @ApiProperty({ description: '填写文件mid' })
  readonly mid: string;

  @ApiProperty({ description: '填写文件name' })
  readonly name: string;
}

// 添加编辑专题
export class AddEditProjectDto {
  @ApiProperty({ description: '_id' })
  readonly _id: string;

  @ApiProperty({ description: '专题名称' })
  readonly name: string;

  @ApiProperty({ description: '专题描述' })
  readonly describe: string;

  @ApiProperty({ description: '缩略图ID' })
  readonly thumbnailId: string;

  @ApiProperty({ description: '内容图ID' })
  readonly contentImageId: string;

  @ApiProperty({ description: '内容' })
  readonly content: string;
}


// 添加编辑菜单
export class AddEditMenuDto {
  @ApiProperty({ description: '_id' })
  readonly _id: string;

  @ApiProperty({ description: '菜单名称', required: true })
  readonly name: string;

  @ApiProperty({ description: '父权限编号', required: true })
  readonly parentId: string;

  @ApiProperty({ description: '菜单等级' })
  readonly level: string;

  @ApiProperty({ description: '是否叶子节点', required: true })
  readonly isChild: string;

  @ApiProperty({ description: '是否显示' })
  readonly isMenu: string;

  @ApiProperty({ description: '图标' })
  readonly icon: string;

  @ApiProperty({ description: '排序数', required: true })
  readonly srot: number;

  @ApiProperty({ description: '菜单权限LIST', required: true })
  readonly btnListArr: [];

  @ApiProperty({ description: 'redirect url' })
  readonly redirectUrl: [];

  @ApiProperty({ description: '路由路径' })
  readonly routerPath: [];

  @ApiProperty({ description: '参数说明' })
  readonly routerParameterDescribe: [];

  @ApiProperty({ description: '路由参数' })
  readonly routerParameter: [];

  @ApiProperty({
    description: '路由名称', required: true
  })
  readonly routerName: [];

  @ApiProperty({ description: '描述信息' })
  readonly routerDescribe: [];
}

// 添加编辑用户
export class AddEditUserDto {
  @ApiProperty({ description: '_id' })
  readonly _id: string;

  @ApiProperty({ description: '管理员用户名', required: true })
  readonly username: string;

  @ApiProperty({ description: '管理员密码', required: true })
  readonly password: string;

  @ApiProperty({ description: '关联角色菜单' })
  readonly power: string;
}
// 系统参数

export class AddEditSystemDto {
  @ApiProperty({ description: 'SYS' })
  readonly _id: string;

  @ApiProperty({ description: '设置信息', required: true })
  readonly setup: object;

  @ApiProperty({ description: '七牛云参数', required: true })
  readonly qiniu: object;

  @ApiProperty({ description: '微信支付参数' })
  readonly wechatPay: object;

  @ApiProperty({ description: '微信参数' })
  readonly wechat: object;
}
// 添加价格
export class AddEditPriceDto {
  @ApiProperty({ description: '金额' })
  readonly payment_price: number;

  @ApiProperty({ description: '价格类型', required: true })
  readonly type: string;

  @ApiProperty({ description: '时间', required: true })
  readonly expir_time: string;

  @ApiProperty({ description: '产品CODE' })
  readonly product_code: string;
}
