/*
 * Decompiled with CFR 0.152.
 */
package com.uiux.macro.utility.aurastyles;

import com.uiux.macro.utility.aurastyles.CssConvertable;
import com.uiux.macro.utility.aurastyles.SvgStylesConvertable;

public class Text
implements CssConvertable,
SvgStylesConvertable {
    private String text;
    private String color;
    private double fontSize;
    private String fontWeight;
    private String textAlign;
    private String tag;

    @Override
    public String convertToCss() {
        String style = "";
        if (this.color != null) {
            style = String.valueOf(style) + "color: " + this.color + " !important;";
        }
        if (this.fontWeight != null) {
            style = String.valueOf(style) + "font-weight: " + this.fontWeight + ";";
        }
        if (this.textAlign != null) {
            style = String.valueOf(style) + "text-align: " + this.textAlign + ";";
        }
        if (this.fontSize != 0.0) {
            style = String.valueOf(style) + "font-size: " + this.fontSize + "px;";
        }
        return style;
    }

    public String getTag() {
        if (this.tag != null && !this.tag.equals("")) {
            return this.tag;
        }
        return "div";
    }

    public void setTag(String tag) {
        this.tag = tag;
    }

    public String getText() {
        return this.text;
    }

    public void setText(String text) {
        this.text = text;
    }

    public String getColor() {
        return this.color;
    }

    public void setColor(String color) {
        this.color = color;
    }

    public double getFontSize() {
        return this.fontSize;
    }

    public void setFontSize(double fontSize) {
        this.fontSize = fontSize;
    }

    public String getFontWeight() {
        return this.fontWeight;
    }

    public void setFontWeight(String fontWeight) {
        this.fontWeight = fontWeight;
    }

    public String getTextAlign() {
        return this.textAlign;
    }

    public void setTextAlign(String textAlign) {
        this.textAlign = textAlign;
    }

    @Override
    public String convertToSvgStyles() {
        String style = "";
        if (this.color != null) {
            style = String.valueOf(style) + "fill: " + this.color + ";";
        }
        if (this.fontSize != 0.0) {
            style = String.valueOf(style) + "width: " + this.fontSize + "px;";
        }
        return style;
    }
}

