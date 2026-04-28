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
 *  org.springframework.beans.factory.annotation.Autowired
 */
package com.uiux.macro.macros;

import com.uiux.macro.macros.AbstractMultiOutputMacro;
import com.uiux.macro.macros.styleconverters.DividerStyles;
import com.uiux.macro.servlets.IconRenderer;
import com.uiux.macro.utility.ClassNameCreator;
import com.uiux.macro.utility.aurastyles.Alignment;
import com.uiux.macro.utility.aurastyles.Border;
import com.uiux.macro.utility.aurastyles.Icon;
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
import java.awt.Dimension;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;

public class Divider
extends AbstractMultiOutputMacro
implements EditorImagePlaceholder {
    @Autowired
    private final ClassNameCreator classNameCreator;
    @Autowired
    private final IconRenderer iconRenderer;
    private final String defaultStyle = "{\"alignment\":{\"horizontal\":\"start\"},\"icon\":{\"name\":\"faPaperPlane\",\"color\":\"#334\",\"size\":24},\"text\":{\"color\":\"#ff0000\",\"fontSize\":24,\"textAlign\":\"left\",\"fontWeight\":\"bold\",\"text\":\"Aura Divider\"},\"border\":{\"top\":false,\"right\":false,\"bottom\":true,\"left\":false,\"color\":\"#0385E7\",\"style\":\"solid\",\"width\":5},\"size\":{\"width\":200}}";
    private final SettingsManager settingsManager = (SettingsManager)ContainerManager.getComponent((String)"settingsManager");

    @Autowired
    public Divider(ClassNameCreator classNameCreator, IconRenderer iconRenderer) {
        this.classNameCreator = classNameCreator;
        this.iconRenderer = iconRenderer;
    }

    @Override
    public String executePDF(Map<String, String> params, String body, ConversionContext ctx) throws MacroExecutionException {
        return "<br>";
    }

    @Override
    public String executeWeb(Map<String, String> params, String body, ConversionContext ctx) throws MacroExecutionException {
        String result = "";
        String type = params.containsKey("type") ? params.get("type") : "regular";
        HashMap<String, Object> templateMap = new HashMap<String, Object>();
        String className = this.classNameCreator.createClassName("aura-divider", params);
        templateMap.put("className", className);
        try {
            Alignment alignment;
            String styles = "{\"alignment\":{\"horizontal\":\"start\"},\"icon\":{\"name\":\"faPaperPlane\",\"color\":\"#334\",\"size\":24},\"text\":{\"color\":\"#ff0000\",\"fontSize\":24,\"textAlign\":\"left\",\"fontWeight\":\"bold\",\"text\":\"Aura Divider\"},\"border\":{\"top\":false,\"right\":false,\"bottom\":true,\"left\":false,\"color\":\"#0385E7\",\"style\":\"solid\",\"width\":5},\"size\":{\"width\":200}}";
            if (params.containsKey("serializedStyles")) {
                styles = params.get("serializedStyles");
            }
            DividerStyles dividerStyles = (DividerStyles)new Gson().fromJson(styles, DividerStyles.class);
            templateMap.put("textStyles", dividerStyles.getTextStyles());
            templateMap.put("borderStyles", dividerStyles.getBorderStyles());
            templateMap.put("wrapperStyles", dividerStyles.getWrapperStyles());
            templateMap.put("dividerStyles", dividerStyles.getDividerStyles());
            double decorationSize = 25.0;
            if (type.equals("icon") && dividerStyles.getIcon() != null) {
                decorationSize = dividerStyles.getIcon().getSize();
            } else if (type.equals("text") && dividerStyles.getText() != null) {
                decorationSize = dividerStyles.getText().getFontSize();
            }
            templateMap.put("height", String.valueOf(decorationSize * 2.0));
            if (dividerStyles.getText() != null) {
                templateMap.put("text", dividerStyles.getText().getText());
            }
            if (dividerStyles.getText() != null) {
                templateMap.put("text", dividerStyles.getText().getText());
            }
            if ((alignment = dividerStyles.getAlignment()) != null) {
                if (!alignment.getHorizontal().equals("start")) {
                    templateMap.put("showFirstBorder", true);
                }
                if (!alignment.getHorizontal().equals("end")) {
                    templateMap.put("showSecondBorder", true);
                }
            }
            if (type.equals("icon") && dividerStyles.getIcon() != null) {
                Icon icon = dividerStyles.getIcon();
                int adjustedSize = (int)icon.getSize();
                String renderedIcon = this.iconRenderer.renderIconByName(icon.getName(), icon.getColor(), new Dimension(adjustedSize, adjustedSize));
                templateMap.put("renderedIconWithHtml", renderedIcon);
            }
            if (!type.equals("regular")) {
                templateMap.put("hasContent", true);
            }
            result = VelocityUtils.getRenderedTemplate((String)"/templates/Divider.vm", templateMap);
        }
        catch (Exception e) {
            result = "<div class=\"aui-message shadowed aui-message-error\"><div class=\"upm-message-text\"><b>Sorry, something went wrong with Aura Divider.</b> Please check the divider's settings in edit mode.</div></div>";
        }
        return result;
    }

    public Macro.BodyType getBodyType() {
        return Macro.BodyType.NONE;
    }

    public Macro.OutputType getOutputType() {
        return Macro.OutputType.BLOCK;
    }

    public ImagePlaceholder getImagePlaceholder(Map<String, String> map, ConversionContext ctx) {
        String baseUrl = this.settingsManager.getGlobalSettings().getBaseUrl();
        Gson gson = new Gson();
        String styles = map.containsKey("serializedStyles") ? map.get("serializedStyles") : "{\"alignment\":{\"horizontal\":\"start\"},\"icon\":{\"name\":\"faPaperPlane\",\"color\":\"#334\",\"size\":24},\"text\":{\"color\":\"#ff0000\",\"fontSize\":24,\"textAlign\":\"left\",\"fontWeight\":\"bold\",\"text\":\"Aura Divider\"},\"border\":{\"top\":false,\"right\":false,\"bottom\":true,\"left\":false,\"color\":\"#0385E7\",\"style\":\"solid\",\"width\":5},\"size\":{\"width\":200}}";
        DividerStyles dividerStyles = (DividerStyles)gson.fromJson(styles, DividerStyles.class);
        String gsonString = gson.toJson((Object)dividerStyles.getBorder(), Border.class);
        String base64 = Base64.getEncoder().encodeToString(gsonString.getBytes());
        String template = "%s/plugins/servlet/aura/macro-preview?params=%s&templateName=Divider";
        String src = String.format(template, baseUrl, base64);
        return new DefaultImagePlaceholder(src, false, new ImageDimensions(-1, -1));
    }
}

