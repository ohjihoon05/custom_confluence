/*
 * Decompiled with CFR 0.152.
 */
package com.uiux.macro.utility.aurastyles;

import com.uiux.macro.utility.aurastyles.CssConvertable;

public class BackgroundColor
implements CssConvertable {
    private String color;

    @Override
    public String convertToCss() {
        return "background-color: " + this.color + ";";
    }

    public String getColor() {
        return this.color;
    }

    public void setColor(String color) {
        this.color = color;
    }
}

