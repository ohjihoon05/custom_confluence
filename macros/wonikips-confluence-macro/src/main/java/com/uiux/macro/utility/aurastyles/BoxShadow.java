/*
 * Decompiled with CFR 0.152.
 */
package com.uiux.macro.utility.aurastyles;

import com.uiux.macro.utility.aurastyles.CssConvertable;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

public class BoxShadow
implements CssConvertable {
    private List<Shadow> shadows;

    public List<Shadow> getShadows() {
        return this.shadows;
    }

    public void setShadows(List<Shadow> shadows) {
        this.shadows = shadows;
    }

    @Override
    public String convertToCss() {
        List styles = this.shadows.stream().map(shadow -> String.format("%.0fpx %.0fpx %.0fpx %.0fpx %s", shadow.getX(), shadow.getY(), shadow.getBlur(), shadow.getSpread(), shadow.getColor())).collect(Collectors.toCollection(ArrayList::new));
        return "box-shadow: " + String.join((CharSequence)", ", styles) + ";";
    }

    public class Shadow {
        private String color;
        private double x;
        private double y;
        private double blur;
        private double spread;

        public String getColor() {
            return this.color;
        }

        public void setColor(String color) {
            this.color = color;
        }

        public double getSpread() {
            return this.spread;
        }

        public void setSpread(double spread) {
            this.spread = spread;
        }

        public double getBlur() {
            return this.blur;
        }

        public void setBlur(double blur) {
            this.blur = blur;
        }

        public double getY() {
            return this.y;
        }

        public void setY(double y) {
            this.y = y;
        }

        public double getX() {
            return this.x;
        }

        public void setX(double x) {
            this.x = x;
        }
    }
}

