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
 */
package com.uiux.macro.macros.cards;

import com.uiux.macro.macros.AbstractMultiOutputMacro;
import com.uiux.macro.macros.cards.CardRenderer;
import com.uiux.macro.utility.ClassNameCreator;
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
import java.lang.reflect.Type;
import java.util.ArrayList;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;

public class Cards
extends AbstractMultiOutputMacro
implements EditorImagePlaceholder {
    @Autowired
    private final ClassNameCreator classNameCreator;
    @Autowired
    private final CardRenderer cardRenderer;
    private final SettingsManager settingsManager;

    @Autowired
    public Cards(ClassNameCreator classNameCreator, CardRenderer cardRenderer) {
        this.cardRenderer = cardRenderer;
        this.classNameCreator = classNameCreator;
        this.settingsManager = (SettingsManager)ContainerManager.getComponent((String)"settingsManager");
    }

    @Override
    public String executePDF(Map<String, String> map, String s, ConversionContext context) throws MacroExecutionException {
        try {
            HashMap<String, Object> templateParams = new HashMap<String, Object>();
            map.forEach(templateParams::put);
            String cardsJson = map.get("cardsCollection");
            if (cardsJson == null || cardsJson.trim().isEmpty()) {
                cardsJson = DEFAULT_CARDS_JSON;
            }
            Gson gson = new Gson();
            Type gsonType = new TypeToken<ArrayList<HashMap<String, String>>>(){}.getType();
            List<HashMap<String, String>> cards = gson.fromJson(cardsJson, gsonType);
            List<String> renderedCards = cards.stream().map(card -> String.format("<h5>%s</h5><p>%s</p>", card.get("title"), card.get("body"))).collect(Collectors.toList());
            return String.join("\n", renderedCards);
        }
        catch (Exception e) {
            return "";
        }
    }

    private static final String DEFAULT_CARDS_JSON = "[{\"title\":\"Card 1\",\"body\":\"Edit this card in macro settings.\"},{\"title\":\"Card 2\",\"body\":\"Edit this card in macro settings.\"},{\"title\":\"Card 3\",\"body\":\"Edit this card in macro settings.\"}]";

    @Override
    public String executeWeb(Map<String, String> map, String s, ConversionContext context) throws MacroExecutionException {
        boolean isMobile = context.getOutputDeviceType() == "mobile";
        try {
            HashMap<String, Object> templateParams = new HashMap<String, Object>();
            map.forEach(templateParams::put);
            if (!templateParams.containsKey("gutter") || templateParams.get("gutter") == null || ((String) templateParams.get("gutter")).isEmpty()) {
                templateParams.put("gutter", "10");
            }
            if (!templateParams.containsKey("columns") || templateParams.get("columns") == null || ((String) templateParams.get("columns")).isEmpty()) {
                templateParams.put("columns", "3");
            }
            if (!templateParams.containsKey("theme") || templateParams.get("theme") == null || ((String) templateParams.get("theme")).isEmpty()) {
                templateParams.put("theme", "aura");
            }
            String cardsJson = map.get("cardsCollection");
            if (cardsJson == null || cardsJson.trim().isEmpty()) {
                cardsJson = DEFAULT_CARDS_JSON;
            }
            Gson gson = new Gson();
            Type gsonType = new TypeToken<ArrayList<HashMap<String, String>>>(){}.getType();
            List<HashMap<String, String>> cards = gson.fromJson(cardsJson, gsonType);
            List<String> renderedCards = cards.stream().map(card -> {
                card.put("theme", map.get("theme"));
                card.put("isMobile", "" + isMobile);
                return card;
            }).map(this.cardRenderer::htmlFromCard).collect(Collectors.toList());
            templateParams.put("cards", renderedCards);
            String className = this.classNameCreator.createClassName("aura-cards", map);
            templateParams.put("className", className);
            String rendered = VelocityUtils.getRenderedTemplate((String)"/templates/CardCollection.vm", templateParams);
            return rendered.trim().replace("\n", "").replaceAll(" +", " ");
        }
        catch (Exception e) {
            return "<div style=\"margin: 1rem; display: inline-block; padding: 1rem; border-radius: 1rem; box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.15); border: 2px solid #eee;\">Please configure the cards in <strong>edit mode!</strong></div>";
        }
    }

    public Macro.BodyType getBodyType() {
        return Macro.BodyType.NONE;
    }

    public Macro.OutputType getOutputType() {
        return Macro.OutputType.BLOCK;
    }

    public ImagePlaceholder getImagePlaceholder(Map<String, String> map, ConversionContext context) {
        String baseUrl = this.settingsManager.getGlobalSettings().getBaseUrl();
        HashMap<String, String> theme = new HashMap<String, String>();
        theme.put("theme", map.get("theme"));
        Gson gson = new Gson();
        Type gsonType = new TypeToken<HashMap<String, String>>(){}.getType();
        String gsonString = gson.toJson(theme, gsonType);
        String base64 = Base64.getEncoder().encodeToString(gsonString.getBytes());
        String template = "%s/plugins/servlet/aura/macro-preview?templateName=Cards&params=%s";
        String src = String.format("%s/plugins/servlet/aura/macro-preview?templateName=Cards&params=%s", baseUrl, base64);
        return new DefaultImagePlaceholder(src, false, new ImageDimensions(-1, -1));
    }
}

