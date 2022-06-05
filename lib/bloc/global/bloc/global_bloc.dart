// ignore_for_file: depend_on_referenced_packages, no_leading_underscores_for_local_identifiers, avoid_types_as_parameter_names, avoid_print

import 'package:bloc/bloc.dart';
import 'package:bloc_concurrency/bloc_concurrency.dart';
import 'package:equatable/equatable.dart';
import 'package:stream_transform/stream_transform.dart';
part 'global_event.dart';
part 'global_state.dart';

EventTransformer<E> throttleDroppable<E>(Duration duration) {
  return (events, mapper) {
    return droppable<E>().call(events.throttle(duration), mapper);
  };
}

const throttleDuration = Duration(milliseconds: 100);

class GlobalBloc extends Bloc<GlobalEvent, GlobalState> {
  GlobalBloc() : super(const GlobalState()) {
    on<getGlobalData>(
      _onFetched,
      transformer: throttleDroppable(throttleDuration),
    );
  }

  Future<void> _onFetched(
    getGlobalData event,
    Emitter<GlobalState> emit,
  ) async {
    print(event.winBottom);
    emit(
      state.copyWith(
        windowWidth: event.winWidth,
        windowHeight: event.winHeight,
        windowTop: event.winTop,
        windowBottom: event.winBottom,
      ),
    );
  }
  // 请求接口

}