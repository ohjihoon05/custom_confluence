/*
 * Decompiled with CFR 0.152.
 */
package com.uiux.macro.utility.aurastyles;

import com.uiux.macro.utility.aurastyles.CssConvertable;

public class Padding
implements CssConvertable {
    private double top;
    private double right;
    private double bottom;
    private double left;

    @Override
    public String convertToCss() {
        String style = "";
        if (this.top == this.bottom && this.top == this.left && this.top == this.right) {
            return "padding: " + this.top + "px;";
        }
        style = String.valueOf(style) + "padding-top: " + this.top + "px;";
        style = String.valueOf(style) + "padding-right: " + this.right + "px;";
        style = String.valueOf(style) + "padding-bottom: " + this.bottom + "px;";
        style = String.valueOf(style) + "padding-left: " + this.left + "px;";
        return style;
    }

    public double getLeft() {
        return this.left;
    }

    public void setLeft(double left) {
        this.left = left;
    }

    public double getBottom() {
        return this.bottom;
    }

    public void setBottom(double bottom) {
        this.bottom = bottom;
    }

    public double getRight() {
        return this.right;
    }

    public void setRight(double right) {
        this.right = right;
    }

    public double getTop() {
        return this.top;
    }

    public void setTop(double top) {
        this.top = top;
    }
}

