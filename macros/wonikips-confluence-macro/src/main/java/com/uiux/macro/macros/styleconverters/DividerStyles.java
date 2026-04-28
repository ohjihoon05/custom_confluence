/*
 * Decompiled with CFR 0.152.
 */
package com.uiux.macro.macros.styleconverters;

import com.uiux.macro.utility.aurastyles.Alignment;
import com.uiux.macro.utility.aurastyles.Border;
import com.uiux.macro.utility.aurastyles.Icon;
import com.uiux.macro.utility.aurastyles.Size;
import com.uiux.macro.utility.aurastyles.Text;

public class DividerStyles {
    private Icon icon;
    private Text text;
    private Border border;
    private Alignment alignment;
    private Size size;

    public String getBorderStyles() {
        if (this.border != null) {
            return this.border.convertToCss();
        }
        return "";
    }

    public String getWrapperStyles() {
        if (this.alignment != null) {
            return this.alignment.convertToCss();
        }
        return "";
    }

    public String getDividerStyles() {
        if (this.size != null) {
            return this.size.convertToCss();
        }
        return "";
    }

    public String getTextStyles() {
        if (this.text != null) {
            return this.text.convertToCss();
        }
        return "";
    }

    public Icon getIcon() {
        return this.icon;
    }

    public void setIcon(Icon icon) {
        this.icon = icon;
    }

    public Text getText() {
        return this.text;
    }

    public void setText(Text text) {
        this.text = text;
    }

    public Border getBorder() {
        return this.border;
    }

    public void setBorder(Border border) {
        this.border = border;
    }

    public Alignment getAlignment() {
        return this.alignment;
    }

    public void setAlignment(Alignment alignment) {
        this.alignment = alignment;
    }

    public Size getSize() {
        return this.size;
    }

    public void setSize(Size size) {
        this.size = size;
    }
}

