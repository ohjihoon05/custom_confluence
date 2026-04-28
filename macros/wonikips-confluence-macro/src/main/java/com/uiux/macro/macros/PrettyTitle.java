/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.atlassian.confluence.content.render.xhtml.ConversionContext
 *  com.atlassian.confluence.macro.Macro
 *  com.atlassian.confluence.macro.Macro$BodyType
 *  com.atlassian.confluence.macro.Macro$OutputType
 *  com.atlassian.confluence.macro.MacroExecutionException
 *  org.springframework.beans.factory.annotation.Autowired
 *  org.springframework.web.util.HtmlUtils
 */
package com.uiux.macro.macros;

import com.uiux.macro.utility.ClassNameCreator;
import com.atlassian.confluence.content.render.xhtml.ConversionContext;
import com.atlassian.confluence.macro.Macro;
import com.atlassian.confluence.macro.MacroExecutionException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.util.HtmlUtils;

public class PrettyTitle
implements Macro {
    @Autowired
    private final ClassNameCreator classNameCreator;

    @Autowired
    public PrettyTitle(ClassNameCreator classNameCreator) {
        this.classNameCreator = classNameCreator;
    }

    public String execute(Map<String, String> map, String body, ConversionContext conversionContext) throws MacroExecutionException {
        HashMap<String, String> styles = new HashMap<String, String>();
        map.put("seed", "" + new Random().nextInt(999999999));
        String headline = map.containsKey("tag") ? map.get("tag") : "h1";
        styles.put("font-size", String.valueOf(map.getOrDefault("fontSize", "16")) + "px");
        styles.put("line-height", String.valueOf(map.getOrDefault("lineHeight", "16")) + "px");
        styles.put("color", map.getOrDefault("color", "inherit"));
        styles.put("font-weight", map.getOrDefault("fontWeight", "inherit"));
        styles.put("text-align", map.getOrDefault("textAlign", "inherit"));
        List styleList = styles.entrySet().stream().map(set -> String.valueOf((String)set.getKey()) + ":" + (String)set.getValue()).collect(Collectors.toList());
        String computedStyles = String.join((CharSequence)" !important; ", styleList);
        String id = this.classNameCreator.createClassName("title-", map);
        return String.format("<%s id=\"%s\" role=\"heading\" style=\"%s\">%s</%s>", headline, id, computedStyles, HtmlUtils.htmlEscape((String)body).replace("\n", "<br />"), headline);
    }

    public Macro.BodyType getBodyType() {
        return Macro.BodyType.PLAIN_TEXT;
    }

    public Macro.OutputType getOutputType() {
        return Macro.OutputType.BLOCK;
    }
}

