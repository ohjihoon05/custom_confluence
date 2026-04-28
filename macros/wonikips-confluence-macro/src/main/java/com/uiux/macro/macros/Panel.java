/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.atlassian.confluence.content.render.xhtml.ConversionContext
 *  com.atlassian.confluence.macro.Macro$BodyType
 *  com.atlassian.confluence.macro.Macro$OutputType
 *  com.atlassian.confluence.macro.MacroExecutionException
 *  com.atlassian.confluence.util.velocity.VelocityUtils
 *  com.google.gson.Gson
 *  org.springframework.beans.factory.annotation.Autowired
 *  org.springframework.web.util.HtmlUtils
 */
package com.uiux.macro.macros;

import com.uiux.macro.macros.AbstractMultiOutputMacro;
import com.uiux.macro.macros.styleconverters.PanelStyles;
import com.uiux.macro.servlets.IconRenderer;
import com.uiux.macro.utility.ClassNameCreator;
import com.uiux.macro.utility.ConfluenceLinkBuilder;
import com.uiux.macro.utility.aurastyles.Icon;
import com.atlassian.confluence.content.render.xhtml.ConversionContext;
import com.atlassian.confluence.macro.Macro;
import com.atlassian.confluence.macro.MacroExecutionException;
import com.atlassian.confluence.util.velocity.VelocityUtils;
import com.google.gson.Gson;
import java.awt.Dimension;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.HashMap;
import java.util.Map;
import java.util.function.BiFunction;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.util.HtmlUtils;

public class Panel
extends AbstractMultiOutputMacro {
    @Autowired
    private final ConfluenceLinkBuilder linkBuilder;
    @Autowired
    private final ClassNameCreator classNameCreator;
    @Autowired
    private final IconRenderer iconRenderer;

    @Autowired
    public Panel(ClassNameCreator classNameCreator, IconRenderer iconRenderer, ConfluenceLinkBuilder linkBuilder) {
        this.classNameCreator = classNameCreator;
        this.iconRenderer = iconRenderer;
        this.linkBuilder = linkBuilder;
    }

    private String renderLegacyMacro(Map<String, String> map, String body, ConversionContext conversionContext) {
        map.put("body", body);
        String className = this.classNameCreator.createClassName("aura-panel", map);
        map.put("className", className);
        if (map.containsKey("icon") && map.get("icon").length() > 0) {
            try {
                String renderedIcon = this.iconRenderer.renderIconByName(map.get("icon"), map.get("color"));
                map.put("renderedIcon", renderedIcon);
            }
            catch (Exception e) {
                e.printStackTrace();
            }
        }
        BiFunction<String, String, String> escape = (k, v) -> HtmlUtils.htmlEscape((String)v);
        map.computeIfPresent("title", escape);
        String rendered = VelocityUtils.getRenderedTemplate((String)"/templates/Panel.vm", map);
        return rendered;
    }

    private String renderPanel(Map<String, String> map, String body, ConversionContext conversionContext) {
        boolean isMobile = conversionContext.getOutputDeviceType() == "mobile";
        String result = "";
        try {
            String styles = map.containsKey("styles") ? map.get("styles") : "{\"base\":{\"borderRadius\":{\"radius\":8},\"backgroundColor\":{\"color\":\"#fff\"},\"border\":{\"color\":\"#999\",\"style\":\"solid\",\"width\":2,\"bottom\":true,\"top\":true,\"left\":true,\"right\":true},\"size\":{\"width\":400},\"boxShadow\":{\"shadows\":[{\"color\":\"rgba(0, 0, 0, 0.08)\",\"x\":0,\"y\":1,\"blur\":1,\"spread\":0},{\"color\":\"rgba(0, 0, 0, 0.16)\",\"x\":0,\"y\":1,\"blur\":3,\"spread\":1}]}},\"headline\":{\"alignment\":{\"horizontal\":\"start\"},\"text\":{\"text\":\"Aura Panel Title\",\"fontSize\":18,\"color\":\"#152A29\",\"textAlign\":\"left\",\"fontWeight\":\"bold\"},\"border\":{\"color\":\"#999\",\"style\":\"solid\",\"top\":false,\"right\":false,\"bottom\":true,\"left\":false,\"width\":1}},\"header\":{\"backgroundColor\":{\"color\":\"#eee\"},\"icon\":{\"size\":18,\"name\":\"faPaperPlane\",\"color\":\"#333\"}},\"body\":{\"text\":{\"fontSize\":14,\"color\":\"#333\",\"texAlign\":\"left\",\"fontWeight\":\"normal\"}}}";
            PanelStyles panelStyles = (PanelStyles)new Gson().fromJson(styles, PanelStyles.class);
            HashMap<String, String> templateMap = new HashMap<String, String>();
            String className = this.classNameCreator.createClassName("aura-panel", map);
            templateMap.put("className", className);
            templateMap.put("baseStyle", panelStyles.getBaseStyle());
            templateMap.put("headerStyle", panelStyles.getHeaderStyles());
            templateMap.put("headlineStyle", panelStyles.getHeadlineStyle());
            templateMap.put("bodyStyle", panelStyles.getBodyStyle());
            if (panelStyles.getHeadline() != null && panelStyles.getHeadline().getText() != null) {
                templateMap.put("tag", panelStyles.getHeadline().getText().getTag());
            } else {
                templateMap.put("tag", "div");
            }
            if (panelStyles.getHeader().getLink() != null && panelStyles.getHeader().getLink().getValue() != null) {
                PanelStyles.PanelHeader.Link link = panelStyles.getHeader().getLink();
                String computedLink = this.linkBuilder.getUrl(link.getType(), link.getValue(), isMobile);
                String target = link.getTarget();
                templateMap.put("href", computedLink);
                templateMap.put("hrefTarget", target == null ? "_self" : target);
                if (panelStyles.getHeadline() != null && panelStyles.getHeadline().getText() != null) {
                    templateMap.put("linkColor", panelStyles.getHeadline().getText().getColor());
                }
            }
            if (panelStyles.getBase() != null && panelStyles.getBase().getBoxshadow() != null) {
                templateMap.put("hasMargin", "true");
            }
            if (panelStyles.getHeadline() != null && panelStyles.getHeadline().getText() != null) {
                templateMap.put("headline", panelStyles.getHeadline().getText().getText());
            }
            if (panelStyles.getHeader() != null && panelStyles.getHeader().getIcon() != null) {
                Icon icon = panelStyles.getHeader().getIcon();
                String renderedIcon = this.iconRenderer.renderIconByName(icon.getName(), icon.getColor(), new Dimension((int)icon.getSize(), (int)icon.getSize()));
                templateMap.put("renderedIconWithHtml", renderedIcon);
            }
            templateMap.put("body", body);
            result = VelocityUtils.getRenderedTemplate((String)"/templates/Panel2.vm", templateMap);
        }
        catch (Exception e) {
            String exceptionAsString;
            StringWriter sw = new StringWriter();
            e.printStackTrace(new PrintWriter(sw));
            result = exceptionAsString = sw.toString();
        }
        return result;
    }

    @Override
    public String executeWeb(Map<String, String> map, String body, ConversionContext conversionContext) throws MacroExecutionException {
        if (map.containsKey("background")) {
            return this.renderLegacyMacro(map, body, conversionContext);
        }
        return this.renderPanel(map, body, conversionContext);
    }

    @Override
    public String executePDF(Map<String, String> map, String body, ConversionContext conversionContext) throws MacroExecutionException {
        if (map.containsKey("background")) {
            return body;
        }
        return this.renderPanel(map, body, conversionContext);
    }

    public Macro.BodyType getBodyType() {
        return Macro.BodyType.RICH_TEXT;
    }

    public Macro.OutputType getOutputType() {
        return Macro.OutputType.BLOCK;
    }
}

