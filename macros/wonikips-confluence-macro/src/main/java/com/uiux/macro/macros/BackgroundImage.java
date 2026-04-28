/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.atlassian.confluence.content.render.xhtml.ConversionContext
 *  com.atlassian.confluence.macro.Macro$BodyType
 *  com.atlassian.confluence.macro.Macro$OutputType
 *  com.atlassian.confluence.macro.MacroExecutionException
 *  org.springframework.beans.factory.annotation.Autowired
 */
package com.uiux.macro.macros;

import com.uiux.macro.macros.AbstractMultiOutputMacro;
import com.uiux.macro.utility.ConfluenceLinkBuilder;
import com.atlassian.confluence.content.render.xhtml.ConversionContext;
import com.atlassian.confluence.macro.Macro;
import com.atlassian.confluence.macro.MacroExecutionException;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;

public class BackgroundImage
extends AbstractMultiOutputMacro {
    @Autowired
    private ConfluenceLinkBuilder linkBuilder;

    public BackgroundImage(ConfluenceLinkBuilder linkBuilder) {
        this.linkBuilder = linkBuilder;
    }

    @Override
    public String executePDF(Map<String, String> map, String body, ConversionContext conversionContext) {
        if (!map.containsKey("backgroundColor")) {
            return body;
        }
        String backgroundColor = map.get("backgroundColor");
        String padding = map.getOrDefault("padding", "0");
        if (backgroundColor.length() > 7) {
            backgroundColor = backgroundColor.substring(0, 7);
        }
        return String.format("<div style=\"background-color: %s; padding: %spx;\">%s</div>", backgroundColor, padding, body);
    }

    @Override
    public String executeWeb(Map<String, String> map, String body, ConversionContext conversionContext) throws MacroExecutionException {
        HashMap<String, String> styles = new HashMap<String, String>();
        LinkedList<String> backgrounds = new LinkedList<String>();
        if (map.containsKey("backgroundColor")) {
            String backgroundColor = map.get("backgroundColor");
            backgrounds.add(String.format("linear-gradient(%s, %s)", backgroundColor, backgroundColor));
        }
        if (map.containsKey("backgroundImageHref") && !map.containsKey("backgroundImageHrefType")) {
            backgrounds.add(String.format("url(%s)", map.get("backgroundImageHref")));
        }
        String formattedUrl = "";
        if (map.containsKey("backgroundImageHref") && map.containsKey("backgroundImageHrefType")) {
            String url = this.linkBuilder.getAttachment(map.get("backgroundImageHrefType"), map.get("backgroundImageHref"));
            formattedUrl = String.format("url(%s)", url);
            backgrounds.add(formattedUrl);
        }
        styles.put("background-image", String.join((CharSequence)" ,", backgrounds));
        styles.put("background-position", map.get("backgroundPosition"));
        styles.put("background-size", map.get("backgroundSize"));
        styles.put("min-height", String.valueOf(map.get("containerMinHeight")) + "px");
        styles.put("justify-content", map.get("contentPosition"));
        styles.put("padding", String.valueOf(map.get("padding")) + "px");
        styles.put("display", "flex");
        styles.put("flex-direction", "column");
        styles.put("background-repeat", "no-repeat");
        styles.put("width", "100%");
        styles.put("box-sizing", "border-box");
        List styleList = styles.entrySet().stream().map(set -> String.valueOf((String)set.getKey()) + ":" + (String)set.getValue()).collect(Collectors.toList());
        String computedStyles = String.join((CharSequence)"; ", styleList);
        return String.format("<div style=\"%s\" aria-role=\"banner\" data-background-image=\"%s\"><div>%s</div></div>", computedStyles, formattedUrl, body);
    }

    public Macro.BodyType getBodyType() {
        return Macro.BodyType.RICH_TEXT;
    }

    public Macro.OutputType getOutputType() {
        return Macro.OutputType.BLOCK;
    }
}

