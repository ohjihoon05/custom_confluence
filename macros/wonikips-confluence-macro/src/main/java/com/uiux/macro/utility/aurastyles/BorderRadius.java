/*
 * Decompiled with CFR 0.152.
 */
package com.uiux.macro.utility.aurastyles;

import com.uiux.macro.utility.aurastyles.CssConvertable;

public class BorderRadius
implements CssConvertable {
    private double radius;

    @Override
    public String convertToCss() {
        return "border-radius: " + this.radius + "px;";
    }

    public double getRadius() {
        return this.radius;
    }

    public void setRadius(double radius) {
        this.radius = radius;
    }
}

