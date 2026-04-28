/*
 * Decompiled with CFR 0.152.
 */
package com.uiux.macro.utility.aurastyles;

import com.uiux.macro.utility.aurastyles.CssConvertable;

public class Size
implements CssConvertable {
    private String width;
    private String height;

    @Override
    public String convertToCss() {
        String style = "";
        if (this.width != null) {
            style = String.valueOf(style) + "display: inline-flex; flex-direction: column;";
            style = String.valueOf(style) + "width: " + this.width + "px;";
        }
        if (this.height != null) {
            style = String.valueOf(style) + "min-height: " + this.height + "px;";
        }
        return style;
    }

    public String getWidth() {
        return this.width;
    }

    public void setWidth(String width) {
        this.width = width;
    }

    public String getHeight() {
        return this.height;
    }

    public void setHeight(String minHeight) {
        this.height = minHeight;
    }
}

