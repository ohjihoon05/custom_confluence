/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.atlassian.confluence.util.velocity.VelocityUtils
 *  com.atlassian.plugin.spring.scanner.annotation.export.ExportAsService
 *  com.google.gson.Gson
 *  com.google.gson.reflect.TypeToken
 *  javax.inject.Named
 *  javax.servlet.http.HttpServlet
 *  org.springframework.beans.factory.annotation.Autowired
 *  org.springframework.core.io.Resource
 *  org.springframework.core.io.ResourceLoader
 */
package com.uiux.macro.servlets;

import com.atlassian.confluence.util.velocity.VelocityUtils;
import com.atlassian.plugin.spring.scanner.annotation.export.ExportAsService;
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import java.awt.Dimension;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.lang.reflect.Type;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import javax.inject.Named;
import javax.servlet.http.HttpServlet;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;

@ExportAsService(value={IconRenderer.class})
@Named(value="IconRenderer")
public class IconRenderer
extends HttpServlet {
    private static final long serialVersionUID = 1L;
    @Autowired
    private ResourceLoader resourceLoader;
    private Map<String, Map<String, String>> iconData = new HashMap<String, Map<String, String>>();
    private boolean hasInitialized = false;

    public void init() {
        Resource resource = this.resourceLoader.getResource("classpath:templates/icondata.json");
        try {
            StringBuilder textBuilder = new StringBuilder();
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8))) {
                int c;
                while ((c = reader.read()) != -1) {
                    textBuilder.append((char)c);
                }
            }
            Gson gson = new Gson();
            Type gsonType = new TypeToken<HashMap<String, HashMap<String, String>>>(){}.getType();
            this.iconData = gson.fromJson(textBuilder.toString(), gsonType);
            this.hasInitialized = true;
        }
        catch (IOException e) {
            e.printStackTrace();
        }
    }

    public String renderIconCharacterByName(String iconName) throws Exception {
        Map<String, String> data;
        if (!this.hasInitialized) {
            this.init();
        }
        if ((data = this.iconData.get(iconName)) != null) {
            return data.get("unicode");
        }
        throw new Exception("Icon Name not found.");
    }

    public String renderIconByName(String iconName, String color) throws Exception {
        return this.renderIconByName(iconName, color, null);
    }

    public String renderIconByName(String iconName, String color, Dimension size) throws Exception {
        Map<String, String> data;
        if (!this.hasInitialized) {
            this.init();
        }
        if ((data = this.iconData.get(iconName)) == null) {
            return "";
        }
        HashMap<String, String> context = new HashMap<String, String>();
        context.put("color", color);
        context.put("path", data.get("path"));
        context.put("viewboxWidth", data.get("width"));
        context.put("viewboxHeight", data.get("height"));
        context.put("iconName", iconName.substring(2));
        if (size != null) {
            context.put("width", String.valueOf((int)size.getWidth()));
            context.put("height", String.valueOf((int)size.getHeight()));
        }
        return VelocityUtils.getRenderedTemplate((String)"/templates/Icon.vm", context);
    }
}

