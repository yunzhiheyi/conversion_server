// ignore_for_file: library_private_types_in_public_api, prefer_const_constructors, use_key_in_widget_constructors, unused_import, avoid_unnecessary_containers, must_call_super, prefer_const_literals_to_create_immutables, avoid_print, unused_element, use_build_context_synchronously, unused_local_variable

import 'package:fluro/fluro.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'dart:async';

import 'package:flutter_animated_dialog/flutter_animated_dialog.dart';
import 'package:max_box/common/AppButton.dart';
import 'package:max_box/utils/adApt.dart';
import 'package:permission_handler/permission_handler.dart';

import '../common/AnimatedDialog.dart';
import '../common/DialogLayout.dart';
import '../common/Dialog.dart';
import '../common/SplashPrivacy.dart';
import '../router/Routes.dart';

class Splash extends StatefulWidget {
  const Splash({Key? key}) : super(key: key);
  @override
  _SplashState createState() => _SplashState();
}

class _SplashState extends State<Splash> {
  @override
  void initState() {
    super.initState();
  }

  /// 退出 APP 方式一
  void _doQuit() async {
    await SystemChannels.platform.invokeMethod('SystemNavigator.pop');
  }

  //单权限申请权限
  void requestPermission(Permission permission) async {
    PermissionStatus status = await permission.request();
    print('权限状态$status');
    if (!status.isPermanentlyDenied) {
      openAppSettings();
      // } else if (status == PermissionStatus.granted) {
    } else {
      Routes.navigateTo(context, '/home', {}, TransitionType.fadeIn);
    }
  }

  //判断是否有权限
  void _checkPermission() async {
    Permission permission = Permission.camera;
    PermissionStatus status = await permission.status;
    print('检测权限$status');
    if (status.isGranted) {
      //权限通过
      Routes.navigateTo(context, '/home', {}, TransitionType.fadeIn);
    } else if (status.isDenied) {
      //权限拒绝， 需要区分IOS和Android，二者不一样
      requestPermission(permission);
    } else if (status.isPermanentlyDenied) {
      //权限永久拒绝，且不在提示，需要进入设置界面
      openAppSettings();
    } else if (status.isRestricted) {
      //活动限制（例如，设置了家长///控件，仅在iOS以上受支持。
      openAppSettings();
    } else {
      //第一次申请
      requestPermission(permission);
    }
  }

  void checkPermission2() async {
    Permission storagePermission = Permission.storage;
    Permission photosPermission = Permission.photos;
    Permission cameraPermission = Permission.camera;
    requestPermissions();
  }

  void requestPermissions() async {
    Map<Permission, PermissionStatus> statuses = await [
      Permission.camera,
      Permission.photos,
      Permission.storage
    ].request();
    print('相机权限：${statuses[Permission.camera]}');
    print('存储权限：${statuses[Permission.storage]}');

    bool isShown = await Permission.contacts.shouldShowRequestRationale;
    print('isShown_____$isShown');
  }

  @override
  Widget build(BuildContext context) {
    SystemChrome.setSystemUIOverlayStyle(SystemUiOverlayStyle.light);
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          borderRadius: BorderRadius.all(Radius.circular(6.0)),
          color: Color.fromRGBO(0, 0, 0, 0.7),
        ),
        alignment: Alignment.center,
        child: Container(
            alignment: Alignment.center,
            child: Container(
                decoration: const BoxDecoration(
                  borderRadius: BorderRadius.all(Radius.circular(12.0)),
                  color: Color.fromARGB(255, 255, 255, 255),
                ),
                alignment: Alignment.center,
                width: Adapt.px(500),
                height: Adapt.px(700),
                child: DialogLayout(
                  title: '用户协议与隐私政策',
                  cancelTitle: '不同意并退出',
                  confirmTitle: '同意',
                  onCancel: () {
                    print('不同意');
                    _doQuit();
                  },
                  onConfirm: () {
                    print('同意');
                    _checkPermission();
                  },
                  child: SplashPrivacy(),
                ))),
      ),
    );
  }
}