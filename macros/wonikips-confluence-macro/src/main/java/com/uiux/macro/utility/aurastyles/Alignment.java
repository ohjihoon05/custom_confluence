/*
 * Decompiled with CFR 0.152.
 */
package com.uiux.macro.utility.aurastyles;

import com.uiux.macro.utility.aurastyles.CssConvertable;

public class Alignment
implements CssConvertable {
    private String horizontal;

    @Override
    public String convertToCss() {
        String style = "display: flex;";
        if (this.horizontal.equals("center")) {
            style = String.valueOf(style) + "justify-content: center;";
        } else if (this.horizontal.equals("start")) {
            style = String.valueOf(style) + "justify-content: flex-start;";
        } else if (this.horizontal.equals("end")) {
            style = String.valueOf(style) + "justify-content: flex-end;";
        }
        return style;
    }

    public String getHorizontal() {
        return this.horizontal;
    }

    public void setHorizontal(String horizontal) {
        this.horizontal = horizontal;
    }
}

