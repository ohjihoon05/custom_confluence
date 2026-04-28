/*
 * Decompiled with CFR 0.152.
 */
package com.uiux.macro.macros.styleconverters;

import com.uiux.macro.utility.aurastyles.Alignment;
import com.uiux.macro.utility.aurastyles.BackgroundColor;
import com.uiux.macro.utility.aurastyles.Border;
import com.uiux.macro.utility.aurastyles.BorderRadius;
import com.uiux.macro.utility.aurastyles.BoxShadow;
import com.uiux.macro.utility.aurastyles.Icon;
import com.uiux.macro.utility.aurastyles.Size;
import com.uiux.macro.utility.aurastyles.Text;

public class PanelStyles {
    private PanelBase base;
    private PanelHeadline headline;
    private PanelHeader header;
    private PanelBody body;

    public String getBaseStyle() {
        if (this.base == null) {
            return "";
        }
        String style = "";
        if (this.base.getSize() != null) {
            style = String.valueOf(style) + this.base.getSize().convertToCss();
        }
        if (this.base.getBoxshadow() != null) {
            style = String.valueOf(style) + this.base.getBoxshadow().convertToCss();
        }
        if (this.base.getBorder() != null) {
            style = String.valueOf(style) + this.base.getBorder().convertToCss();
        }
        if (this.base.getBorderRadius() != null) {
            style = String.valueOf(style) + this.base.getBorderRadius().convertToCss();
        }
        if (this.base.getBackgroundColor() != null) {
            style = String.valueOf(style) + this.base.getBackgroundColor().convertToCss();
        }
        return style;
    }

    public String getHeadlineStyle() {
        if (this.headline == null) {
            return "";
        }
        String style = "";
        if (this.headline.getText() != null) {
            style = String.valueOf(style) + this.headline.getText().convertToCss();
        }
        if (this.headline.getBorder() != null) {
            style = String.valueOf(style) + this.headline.getBorder().convertToCss();
        }
        if (this.headline.getAlignment() != null) {
            style = String.valueOf(style) + this.headline.getAlignment().convertToCss();
        }
        return style;
    }

    public String getHeaderStyles() {
        if (this.header == null) {
            return "";
        }
        String style = "";
        if (this.header.getBackgroundColor() != null) {
            style = String.valueOf(style) + this.header.getBackgroundColor().convertToCss();
        }
        return style;
    }

    public String getBodyStyle() {
        if (this.body == null) {
            return "";
        }
        String style = "";
        if (this.body.getText() != null) {
            style = String.valueOf(style) + this.body.getText().convertToCss();
        }
        return style;
    }

    public PanelBase getBase() {
        return this.base;
    }

    public void setBase(PanelBase base) {
        this.base = base;
    }

    public PanelHeadline getHeadline() {
        return this.headline;
    }

    public void setHeadline(PanelHeadline headline) {
        this.headline = headline;
    }

    public PanelHeader getHeader() {
        return this.header;
    }

    public void setHeader(PanelHeader header) {
        this.header = header;
    }

    public PanelBody getBody() {
        return this.body;
    }

    public void setBody(PanelBody body) {
        this.body = body;
    }

    public class PanelBase {
        private Size size;
        private BoxShadow boxShadow;
        private Border border;
        private BorderRadius borderRadius;
        private BackgroundColor backgroundColor;

        public BoxShadow getBoxshadow() {
            return this.boxShadow;
        }

        public Size getSize() {
            return this.size;
        }

        public void setSize(Size size) {
            this.size = size;
        }

        public BackgroundColor getBackgroundColor() {
            return this.backgroundColor;
        }

        public void setBackgroundColor(BackgroundColor backgroundColor) {
            this.backgroundColor = backgroundColor;
        }

        public BorderRadius getBorderRadius() {
            return this.borderRadius;
        }

        public void setBorderRadius(BorderRadius borderRadius) {
            this.borderRadius = borderRadius;
        }

        public void setBoxshadow(BoxShadow shadow) {
            this.boxShadow = shadow;
        }

        public Border getBorder() {
            return this.border;
        }

        public void setBorder(Border border) {
            this.border = border;
        }
    }

    public class PanelBody {
        private Text text;

        public Text getText() {
            return this.text;
        }

        public void setText(Text text) {
            this.text = text;
        }
    }

    public class PanelHeader {
        private Link link;
        private BackgroundColor backgroundColor;
        private Icon icon;

        public BackgroundColor getBackgroundColor() {
            return this.backgroundColor;
        }

        public Link getLink() {
            return this.link;
        }

        public void setLink(Link link) {
            this.link = link;
        }

        public Icon getIcon() {
            return this.icon;
        }

        public void setIcon(Icon icon) {
            this.icon = icon;
        }

        public void setBackgroundColor(BackgroundColor backgroundColor) {
            this.backgroundColor = backgroundColor;
        }

        public class Link {
            private String value;
            private String type;
            private String target;

            public String getValue() {
                return this.value;
            }

            public String getTarget() {
                return this.target;
            }

            public void setTarget(String target) {
                this.target = target;
            }

            public String getType() {
                return this.type;
            }

            public void setType(String type) {
                this.type = type;
            }

            public void setValue(String value) {
                this.value = value;
            }
        }
    }

    public class PanelHeadline {
        private Text text;
        private Border border;
        private Alignment alignment;

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
    }
}

