// ignore_for_file: avoid_print, camel_case_types, unused_import

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

class NavigatorRouterObserver<R extends Route<dynamic>>
    extends RouteObserver<R> {
  @override
  void didPush(Route? route, Route? previousRoute) {
    super.didPush(route!, previousRoute);
    print(
        'didPush route: ${route.settings.name},previousRoute:${previousRoute?.settings.name}');
  }

  @override
  void didPop(Route? route, Route? previousRoute) {
    super.didPop(route!, previousRoute);
    print(
        'didPop route: ${route.settings.name},previousRoute:${previousRoute?.settings.name}');
  }

  @override
  void didReplace({Route? newRoute, Route? oldRoute}) {
    super.didReplace(newRoute: newRoute, oldRoute: oldRoute);
    print('didReplace newRoute: $newRoute,oldRoute:$oldRoute');
  }

  @override
  void didRemove(Route? route, Route? previousRoute) {
    super.didRemove(route!, previousRoute);
    print(
        'didRemove route:${route.settings.name},previousRoute:${previousRoute?.settings.name}');
  }

  @override
  void didStartUserGesture(Route? route, Route? previousRoute) {
    super.didStartUserGesture(route!, previousRoute);
    print(
        'didStartUserGesture route: ${route.settings.name},previousRoute:${previousRoute?.settings.name}');
  }

  @override
  void didStopUserGesture() {
    super.didStopUserGesture();
    print('didStopUserGesture');
  }
}
