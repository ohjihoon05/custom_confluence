/*
 * Decompiled with CFR 0.152.
 */
package com.uiux.macro.macros.styleconverters;

import com.uiux.macro.utility.aurastyles.BackgroundColor;
import com.uiux.macro.utility.aurastyles.Border;
import com.uiux.macro.utility.aurastyles.BoxShadow;
import com.uiux.macro.utility.aurastyles.Padding;
import com.uiux.macro.utility.aurastyles.Size;
import com.uiux.macro.utility.aurastyles.Text;

public class TabCollectionStyles {
    private GeneralSettings generalSettings;
    private TabSettings activeSettings;
    private TabSettings inactiveSettings;
    private TabSettings hoverSettings;
    private ContentSettings contentSettings;

    public GeneralSettings getGeneralSettings() {
        return this.generalSettings;
    }

    public ContentSettings getContentSettings() {
        return this.contentSettings;
    }

    public void setContentSettings(ContentSettings contentSettings) {
        this.contentSettings = contentSettings;
    }

    public TabSettings getHoverSettings() {
        return this.hoverSettings;
    }

    public void setHoverSettings(TabSettings hoverSettings) {
        this.hoverSettings = hoverSettings;
    }

    public TabSettings getInactiveSettings() {
        return this.inactiveSettings;
    }

    public void setInactiveSettings(TabSettings inactiveSettings) {
        this.inactiveSettings = inactiveSettings;
    }

    public TabSettings getActiveSettings() {
        return this.activeSettings;
    }

    public void setActiveSettings(TabSettings activeSettings) {
        this.activeSettings = activeSettings;
    }

    public void setGeneralSettings(GeneralSettings generalSettings) {
        this.generalSettings = generalSettings;
    }

    private String generateTabStyle(TabSettings settings) {
        String style = "";
        if (settings == null) {
            return "";
        }
        if (settings.getText() != null) {
            style = String.valueOf(style) + settings.getText().convertToCss();
        }
        if (settings.getBorder() != null) {
            style = String.valueOf(style) + settings.getBorder().convertToCss();
        }
        if (settings.getBackgroundColor() != null) {
            style = String.valueOf(style) + settings.getBackgroundColor().convertToCss();
        }
        return style;
    }

    public String getActiveTabStyle() {
        return this.generateTabStyle(this.getActiveSettings());
    }

    public String getInactiveTabStyle() {
        return this.generateTabStyle(this.getInactiveSettings());
    }

    public String getHoverTabStyle() {
        return this.generateTabStyle(this.getHoverSettings());
    }

    public String getContentStyle() {
        String style = "";
        if (this.getContentSettings() == null) {
            return "";
        }
        if (this.getContentSettings().getBoxShadow() != null) {
            style = String.valueOf(style) + this.getContentSettings().getBoxShadow().convertToCss();
        }
        if (this.getContentSettings().getBorder() != null) {
            style = String.valueOf(style) + this.getContentSettings().getBorder().convertToCss();
        }
        if (this.getContentSettings().getBackgroundColor() != null) {
            style = String.valueOf(style) + this.getContentSettings().getBackgroundColor().convertToCss();
        }
        if (this.getContentSettings().getPadding() != null) {
            style = String.valueOf(style) + this.getContentSettings().getPadding().convertToCss();
        }
        return style;
    }

    public class ContentSettings {
        private Border border;
        private BoxShadow boxShadow;
        private BackgroundColor backgroundColor;
        private Padding padding;
        private Size size;

        public Border getBorder() {
            return this.border;
        }

        public Size getSize() {
            return this.size;
        }

        public void setSize(Size size) {
            this.size = size;
        }

        public Padding getPadding() {
            return this.padding;
        }

        public void setPadding(Padding padding) {
            this.padding = padding;
        }

        public BackgroundColor getBackgroundColor() {
            return this.backgroundColor;
        }

        public void setBackgroundColor(BackgroundColor backgroundColor) {
            this.backgroundColor = backgroundColor;
        }

        public BoxShadow getBoxShadow() {
            return this.boxShadow;
        }

        public void setBoxShadow(BoxShadow boxShadow) {
            this.boxShadow = boxShadow;
        }

        public void setBorder(Border border) {
            this.border = border;
        }
    }

    public class GeneralSettings {
        private double tabHeight;
        private double tabWidth;
        private double tabSpacing;
        private String direction;

        public double getTabHeight() {
            return this.tabHeight;
        }

        public boolean isSticky() {
            return true;
        }

        public void setSticky(boolean sticky) {
        }

        public String getDirection() {
            return this.direction;
        }

        public void setDirection(String direction) {
            this.direction = direction;
        }

        public double getTabSpacing() {
            return this.tabSpacing;
        }

        public void setTabSpacing(double tabSpacing) {
            this.tabSpacing = tabSpacing;
        }

        public double getTabWidth() {
            return this.tabWidth;
        }

        public void setTabWidth(double tabWidth) {
            this.tabWidth = tabWidth;
        }

        public void setTabHeight(double tabHeight) {
            this.tabHeight = tabHeight;
        }
    }

    public class TabSettings {
        private Border border;
        private BackgroundColor backgroundColor;
        private Text text;

        public Border getBorder() {
            return this.border;
        }

        public void setBorder(Border border) {
            this.border = border;
        }

        public BackgroundColor getBackgroundColor() {
            return this.backgroundColor;
        }

        public void setBackgroundColor(BackgroundColor backgroundColor) {
            this.backgroundColor = backgroundColor;
        }

        public Text getText() {
            return this.text;
        }

        public void setText(Text text) {
            this.text = text;
        }
    }
}

