/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.atlassian.confluence.content.render.image.ImageDimensions
 *  com.atlassian.confluence.content.render.xhtml.ConversionContext
 *  com.atlassian.confluence.macro.DefaultImagePlaceholder
 *  com.atlassian.confluence.macro.EditorImagePlaceholder
 *  com.atlassian.confluence.macro.ImagePlaceholder
 *  com.atlassian.confluence.macro.Macro$BodyType
 *  com.atlassian.confluence.macro.Macro$OutputType
 *  com.atlassian.confluence.macro.MacroExecutionException
 *  com.atlassian.confluence.setup.settings.SettingsManager
 *  com.atlassian.confluence.util.velocity.VelocityUtils
 *  com.atlassian.spring.container.ContainerManager
 *  com.google.gson.Gson
 *  com.google.gson.reflect.TypeToken
 *  org.springframework.beans.factory.annotation.Autowired
 *  org.springframework.web.util.HtmlUtils
 */
package com.uiux.macro.macros;

import com.uiux.macro.macros.AbstractMultiOutputMacro;
import com.uiux.macro.servlets.IconRenderer;
import com.uiux.macro.utility.ClassNameCreator;
import com.uiux.macro.utility.ConfluenceLinkBuilder;
import com.atlassian.confluence.content.render.image.ImageDimensions;
import com.atlassian.confluence.content.render.xhtml.ConversionContext;
import com.atlassian.confluence.macro.DefaultImagePlaceholder;
import com.atlassian.confluence.macro.EditorImagePlaceholder;
import com.atlassian.confluence.macro.ImagePlaceholder;
import com.atlassian.confluence.macro.Macro;
import com.atlassian.confluence.macro.MacroExecutionException;
import com.atlassian.confluence.setup.settings.SettingsManager;
import com.atlassian.confluence.util.velocity.VelocityUtils;
import com.atlassian.spring.container.ContainerManager;
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import java.awt.Dimension;
import java.lang.reflect.Type;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.function.BiFunction;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.util.HtmlUtils;

public class Button
extends AbstractMultiOutputMacro
implements EditorImagePlaceholder {
    @Autowired
    private final ClassNameCreator classNameCreator;
    @Autowired
    private final IconRenderer iconRenderer;
    @Autowired
    private final ConfluenceLinkBuilder linkBuilder;
    private final SettingsManager settingsManager;

    @Autowired
    public Button(ClassNameCreator classNameCreator, IconRenderer iconRenderer, ConfluenceLinkBuilder linkBuilder) {
        this.iconRenderer = iconRenderer;
        this.settingsManager = (SettingsManager)ContainerManager.getComponent((String)"settingsManager");
        this.classNameCreator = classNameCreator;
        this.linkBuilder = linkBuilder;
    }

    @Override
    public String executePDF(Map<String, String> map, String s, ConversionContext conversionContext) throws MacroExecutionException {
        map.remove("icon");
        return this.executeWeb(map, s, conversionContext);
    }

    @Override
    public String executeWeb(Map<String, String> map, String s, ConversionContext conversionContext) throws MacroExecutionException {
        boolean isMobile = conversionContext.getOutputDeviceType() == "mobile";
        String link = this.linkBuilder.getUrl(map.get("hrefType"), map.get("href"), isMobile);
        String className = this.classNameCreator.createClassName("aura-button", map);
        map.put("className", className);
        map.put("computedLink", link);
        if (map.containsKey("icon") && map.get("icon").length() > 0) {
            try {
                String renderedIcon = this.iconRenderer.renderIconByName(map.get("icon"), map.get("color"), new Dimension(14, 14));
                map.put("renderedIcon", renderedIcon);
            }
            catch (Exception renderedIcon) {
                // empty catch block
            }
        }
        BiFunction<String, String, String> escape = (k, v) -> HtmlUtils.htmlEscape((String)v);
        map.computeIfPresent("label", escape);
        String rendered = VelocityUtils.getRenderedTemplate((String)"/templates/Button.vm", map);
        return rendered.trim().replace("\n", "").replaceAll(" +", " ");
    }

    public Macro.BodyType getBodyType() {
        return Macro.BodyType.NONE;
    }

    public Macro.OutputType getOutputType() {
        return Macro.OutputType.BLOCK;
    }

    public ImagePlaceholder getImagePlaceholder(Map<String, String> map, ConversionContext conversionContext) {
        String baseUrl = this.settingsManager.getGlobalSettings().getBaseUrl();
        String label = map.get("label");
        if (label != null && label.length() > 30) {
            map.put("label", String.valueOf(label.substring(0, 30)) + "...");
        }
        Gson gson = new Gson();
        Type gsonType = new TypeToken<HashMap<String, String>>(){}.getType();
        String gsonString = gson.toJson(map, gsonType);
        String base64 = Base64.getEncoder().encodeToString(gsonString.getBytes());
        String template = "%s/plugins/servlet/aura/macro-preview?params=%s&templateName=Button";
        String src = String.format(template, baseUrl, base64);
        return new DefaultImagePlaceholder(src, false, new ImageDimensions(-1, -1));
    }
}

