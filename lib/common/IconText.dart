// ignore_for_file: file_names, library_private_types_in_public_api, avoid_unnecessary_containers, unnecessary_const, prefer_const_constructors, sized_box_for_whitespace, unnecessary_new, prefer_const_literals_to_create_immutables, must_be_immutable, unnecessary_null_comparison

import 'package:flutter/material.dart';
import 'package:max_box/utils/adApt.dart';

class IconText extends StatefulWidget {
  final String title;
  final VoidCallback? onTap;
  final Widget? icon;
  final Axis direction;
  final Color? color;
  final double? fontSize;

  const IconText(
      {Key? key,
      required this.direction,
      this.title = '',
      this.onTap,
      this.fontSize,
      this.icon,
      this.color})
      : assert(direction != null),
        super(key: key);

  @override
  _IconTextState createState() => _IconTextState();
}

class _IconTextState extends State<IconText> {
  @override
  void initState() {
    super.initState();
  }

  Future<void> _onPressedSubmit() async {
    widget.onTap?.call();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
        onTap: _onPressedSubmit,
        child: Flex(direction: widget.direction, children: [
          Container(
              width: Adapt.px(50),
              height: Adapt.px(50),
              alignment: Alignment.center,
              child: widget.icon ?? Text('')),
          Text(
            widget.title,
            style: TextStyle(
                color: widget.color ?? Color.fromARGB(255, 255, 255, 255),
                fontSize: Adapt.px(widget.fontSize ?? 24)),
          )
        ]));
  }
}