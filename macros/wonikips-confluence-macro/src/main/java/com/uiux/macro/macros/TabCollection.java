/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.atlassian.confluence.content.render.xhtml.ConversionContext
 *  com.atlassian.confluence.content.render.xhtml.ConversionContextOutputType
 *  com.atlassian.confluence.content.render.xhtml.storage.macro.MacroId
 *  com.atlassian.confluence.macro.Macro$BodyType
 *  com.atlassian.confluence.macro.Macro$OutputType
 *  com.atlassian.confluence.macro.MacroExecutionException
 *  com.atlassian.confluence.util.GeneralUtil
 *  com.atlassian.confluence.util.velocity.VelocityUtils
 *  com.atlassian.confluence.xhtml.api.MacroDefinition
 *  com.google.gson.Gson
 *  org.jsoup.Jsoup
 *  org.jsoup.nodes.Document
 *  org.jsoup.select.Elements
 *  org.springframework.beans.factory.annotation.Autowired
 */
package com.uiux.macro.macros;

import com.uiux.macro.macros.AbstractMultiOutputMacro;
import com.uiux.macro.macros.styleconverters.TabCollectionStyles;
import com.uiux.macro.servlets.IconRenderer;
import com.uiux.macro.utility.aurastyles.Text;
import com.atlassian.confluence.content.render.xhtml.ConversionContext;
import com.atlassian.confluence.content.render.xhtml.ConversionContextOutputType;
import com.atlassian.confluence.content.render.xhtml.storage.macro.MacroId;
import com.atlassian.confluence.macro.Macro;
import com.atlassian.confluence.macro.MacroExecutionException;
import com.atlassian.confluence.util.velocity.VelocityUtils;
import com.atlassian.confluence.xhtml.api.MacroDefinition;
import com.google.gson.Gson;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.beans.factory.annotation.Autowired;

public class TabCollection
extends AbstractMultiOutputMacro {
    @Autowired
    private final IconRenderer iconRenderer;

    public TabCollection(IconRenderer iconRenderer) {
        this.iconRenderer = iconRenderer;
    }

    private List<Tab> getTabsFromBody(String body) {
        ArrayList<Element> tabElements = new ArrayList<Element>();
        Document doc = Jsoup.parse("<div id=\"current\">" + body + "</div>");
        Elements elements = doc.select("#current > [data-aura-tab-id]");
        elements.forEach(tabElements::add);
        List<Tab> tabList = tabElements.stream().map(e -> {
            String title = e.attr("data-aura-tab-title");
            String icon = e.attr("data-aura-tab-icon");
            String id = e.attr("data-aura-tab-id");
            String renderedIcon = "";
            if (icon == null || !icon.equals("")) {
                try {
                    renderedIcon = this.iconRenderer.renderIconByName(icon, "#000000");
                }
                catch (Exception exception) {
                    exception.printStackTrace();
                }
            }
            return new Tab(id, title, renderedIcon, false);
        }).collect(Collectors.toList());
        tabList.stream().findFirst().orElseGet(() -> new Tab("", "", "", false)).setActive(true);
        return tabList;
    }

    private String getTextSvgStyles(Text text) {
        if (text == null) {
            return "";
        }
        return text.convertToSvgStyles();
    }

    @Override
    public String executePDF(Map<String, String> map, String body, ConversionContext context) throws MacroExecutionException {
        return body;
    }

    @Override
    public String executeWeb(Map<String, String> params, String body, ConversionContext ctx) throws MacroExecutionException {
        String template = "";
        HashMap<String, Object> templateParams = new HashMap<String, Object>();
        MacroDefinition macroDefinition = (MacroDefinition)ctx.getProperty("macroDefinition");
        String id = "";
        Optional<MacroId> optional = macroDefinition.getMacroIdentifier();
        MacroId macroId = optional.orElse(null);
        if (macroId != null) {
            id = macroId.getId();
        }
        templateParams.put("className", "aura-tab-container-" + id);
        try {
            List<Tab> tabs = this.getTabsFromBody(body);
            templateParams.put("body", body);
            templateParams.put("tabs", tabs);
            String settings = params.getOrDefault("settings", "{\"general\":{\"tabSpacing\":0,\"tabWidth\":100,\"tabHeight\":50,\"direction\":\"horizontal\"},\"content\":{\"boxShadow\":{\"shadows\":[{\"color\":\"rgba(0, 0, 0, 0.08)\",\"x\":0,\"y\":1,\"blur\":1,\"spread\":0},{\"color\":\"rgba(0, 0, 0, 0.16)\",\"x\":0,\"y\":1,\"blur\":3,\"spread\":1}]},\"backgroundColor\":{\"color\":\"#fff\"}},\"active\":{\"backgroundColor\":{\"color\":\"#0052cc\"},\"text\":{\"fontSize\":18,\"color\":\"#fff\",\"textAlign\":\"left\",\"fontWeight\":\"normal\"}},\"hover\":{\"backgroundColor\":{\"color\":\"#0052cc\"},\"text\":{\"fontSize\":18,\"color\":\"#fff\",\"textAlign\":\"left\",\"fontWeight\":\"normal\"}},\"inactive\":{\"backgroundColor\":{\"color\":\"#ebecf0\"},\"text\":{\"fontSize\":18,\"color\":\"#5e6c84\",\"textAlign\":\"left\",\"fontWeight\":\"normal\"}}}");
            TabCollectionStyles tabCollectionStyles = (TabCollectionStyles)new Gson().fromJson(settings, TabCollectionStyles.class);
            templateParams.put("general", tabCollectionStyles.getGeneralSettings());
            templateParams.put("activeStyles", tabCollectionStyles.getActiveTabStyle());
            templateParams.put("inactiveStyles", tabCollectionStyles.getInactiveTabStyle());
            templateParams.put("hoverStyles", tabCollectionStyles.getHoverTabStyle());
            templateParams.put("contentStyles", tabCollectionStyles.getContentStyle());
            templateParams.put("iconStylesActive", this.getTextSvgStyles(tabCollectionStyles.getActiveSettings().getText()));
            templateParams.put("iconStylesInactive", this.getTextSvgStyles(tabCollectionStyles.getInactiveSettings().getText()));
            templateParams.put("iconStylesHover", this.getTextSvgStyles(tabCollectionStyles.getHoverSettings().getText()));
            if (tabCollectionStyles.getContentSettings() != null) {
                templateParams.put("hasShadow", tabCollectionStyles.getContentSettings().getBoxShadow() != null);
                if (tabCollectionStyles.getContentSettings().getSize() != null && tabCollectionStyles.getContentSettings().getSize().getHeight() != null) {
                    templateParams.put("contentHeight", tabCollectionStyles.getContentSettings().getSize().getHeight());
                }
            }
            if (ConversionContextOutputType.PREVIEW.value().equals(ctx.getOutputType())) {
                templateParams.put("mode", "preview");
            } else {
                templateParams.put("mode", "view");
            }
            template = VelocityUtils.getRenderedTemplate((String)"/templates/TabCollection.vm", templateParams);
        }
        catch (Exception e) {
            return "<div class=\"aui-message shadowed aui-message-error\"><div class=\"upm-message-text\"><b>Sorry, something went wrong with Aura Tab Group.</b> Please check the group's settings in edit mode.</div></div>";
        }
        return template;
    }

    public Macro.BodyType getBodyType() {
        return Macro.BodyType.RICH_TEXT;
    }

    public Macro.OutputType getOutputType() {
        return Macro.OutputType.BLOCK;
    }

    public class Tab {
        private String id;
        private String title;
        private String icon;
        private boolean isActive;

        public Tab(String id, String title, String icon, boolean isActive) {
            this.id = id;
            this.title = title;
            this.isActive = isActive;
            this.icon = icon;
        }

        public String getId() {
            return this.id;
        }

        public void setId(String id) {
            this.id = id;
        }

        public String getTitle() {
            return this.title;
        }

        public void setTitle(String title) {
            this.title = title;
        }

        public boolean isActive() {
            return this.isActive;
        }

        public void setActive(boolean isActive) {
            this.isActive = isActive;
        }

        public String getIcon() {
            return this.icon;
        }

        public void setIcon(String icon) {
            this.icon = icon;
        }
    }
}

