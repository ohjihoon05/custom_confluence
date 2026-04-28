/*
 * Decompiled with CFR 0.152.
 */
package com.uiux.macro.macros.cards;

public class CardStyle {
    public String card;
    public String icon;
    public String iconColor;

    public CardStyle(String card, String icon, String iconColor) {
        this.card = card;
        this.icon = icon;
        this.iconColor = iconColor;
    }

    public String getCard() {
        return this.card;
    }

    public String getIcon() {
        return this.icon;
    }

    public String getIconColor() {
        return this.iconColor;
    }
}

