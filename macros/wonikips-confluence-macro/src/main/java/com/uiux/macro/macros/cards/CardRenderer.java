/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.atlassian.confluence.util.velocity.VelocityUtils
 *  org.springframework.beans.factory.annotation.Autowired
 *  org.springframework.stereotype.Component
 *  org.springframework.web.util.HtmlUtils
 */
package com.uiux.macro.macros.cards;

import com.uiux.macro.macros.cards.CardStyle;
import com.uiux.macro.servlets.IconRenderer;
import com.uiux.macro.utility.ConfluenceLinkBuilder;
import com.atlassian.confluence.util.velocity.VelocityUtils;
import java.awt.Dimension;
import java.util.HashMap;
import java.util.Map;
import java.util.function.BiFunction;
import java.util.function.Function;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.util.HtmlUtils;

@Component
public class CardRenderer {
    @Autowired
    private IconRenderer iconRenderer;
    @Autowired
    private ConfluenceLinkBuilder linkBuilder;
    private Map<String, Function<Map<String, Object>, CardStyle>> cardStyleGenerators;

    public CardRenderer(ConfluenceLinkBuilder linkBuilder, IconRenderer iconRenderer) {
        this.iconRenderer = iconRenderer;
        this.linkBuilder = linkBuilder;
        this.cardStyleGenerators = new HashMap<String, Function<Map<String, Object>, CardStyle>>();
        this.cardStyleGenerators.put("aura", map -> {
            CardStyle styles = new CardStyle("background: #fff;", "", map.get("color").toString());
            return styles;
        });
        this.cardStyleGenerators.put("aura-accent", map -> {
            String color = map.get("color").toString();
            CardStyle styles = new CardStyle("background: #fff; border-top: 4px solid " + color + ";", "background-color: " + color + "33;", map.get("color").toString());
            return styles;
        });
        this.cardStyleGenerators.put("fabric", map -> {
            String color = map.get("color").toString();
            CardStyle styles = new CardStyle(String.format("background: %s;", color), "", "#fff");
            return styles;
        });
    }

    public String htmlFromCard(Map<String, String> map) {
        String link = this.linkBuilder.getUrl(map.get("hrefType"), map.get("href"), map.get("isMobile").equals("true"));
        String image = "";
        if (map.containsKey("image") && map.containsKey("imageType")) {
            image = this.linkBuilder.getAttachment(map.get("imageType"), map.get("image"));
        }
        map.put("image", image);
        HashMap<String, Object> params = new HashMap<String, Object>();
        map.forEach(params::put);
        if (link != "#") {
            params.put("computedLink", link);
        }
        BiFunction<String, Object, String> escape = (k, v) -> HtmlUtils.htmlEscape((String)v.toString());
        params.computeIfPresent("title", escape);
        params.computeIfPresent("body", escape);
        params.computeIfPresent("body", (k, v) -> v.toString().replace("\n", "<br>"));
        String theme = map.get("theme");
        Function<Map<String, Object>, CardStyle> generator = this.cardStyleGenerators.containsKey(theme) ? this.cardStyleGenerators.get(theme) : this.cardStyleGenerators.get("aura");
        CardStyle styles = generator.apply(params);
        params.put("styles", styles);
        if (map.containsKey("icon") && map.get("icon").length() > 0) {
            try {
                String renderedIcon = this.iconRenderer.renderIconByName(map.get("icon"), styles.getIconColor(), new Dimension(14, 14));
                params.put("renderedIcon", renderedIcon);
            }
            catch (Exception renderedIcon) {
                // empty catch block
            }
        }
        String rendered = VelocityUtils.getRenderedTemplate((String)"/templates/Card.vm", params);
        return rendered;
    }
}

