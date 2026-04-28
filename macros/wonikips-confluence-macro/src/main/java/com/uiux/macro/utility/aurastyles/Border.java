/*
 * Decompiled with CFR 0.152.
 */
package com.uiux.macro.utility.aurastyles;

import com.uiux.macro.utility.aurastyles.CssConvertable;

public class Border
implements CssConvertable {
    private String style;
    private String color;
    private double width;
    private boolean top;
    private boolean right;
    private boolean bottom;
    private boolean left;

    @Override
    public String convertToCss() {
        String border = String.format("%.0fpx %s %s", this.width, this.style, this.color);
        String style = "";
        if (this.isTop()) {
            style = String.valueOf(style) + "border-top: " + border + ";";
        }
        if (this.isRight()) {
            style = String.valueOf(style) + "border-right: " + border + ";";
        }
        if (this.isBottom()) {
            style = String.valueOf(style) + "border-bottom: " + border + ";";
        }
        if (this.isLeft()) {
            style = String.valueOf(style) + "border-left: " + border + ";";
        }
        return style;
    }

    public String getStyle() {
        return this.style;
    }

    public void setStyle(String style) {
        this.style = style;
    }

    public String getColor() {
        return this.color;
    }

    public void setColor(String color) {
        this.color = color;
    }

    public double getWidth() {
        return this.width;
    }

    public void setWidth(double width) {
        this.width = width;
    }

    public boolean isTop() {
        return this.top;
    }

    public void setTop(boolean top) {
        this.top = top;
    }

    public boolean isRight() {
        return this.right;
    }

    public void setRight(boolean right) {
        this.right = right;
    }

    public boolean isBottom() {
        return this.bottom;
    }

    public void setBottom(boolean bottom) {
        this.bottom = bottom;
    }

    public boolean isLeft() {
        return this.left;
    }

    public void setLeft(boolean left) {
        this.left = left;
    }
}

