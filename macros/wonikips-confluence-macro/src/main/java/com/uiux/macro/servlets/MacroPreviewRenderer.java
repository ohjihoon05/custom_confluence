/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.atlassian.confluence.util.velocity.VelocityUtils
 *  com.google.gson.Gson
 *  com.google.gson.reflect.TypeToken
 *  javax.servlet.http.HttpServlet
 *  javax.servlet.http.HttpServletRequest
 *  javax.servlet.http.HttpServletResponse
 *  org.springframework.beans.factory.annotation.Autowired
 */
package com.uiux.macro.servlets;

import com.uiux.macro.servlets.IconRenderer;
import com.atlassian.confluence.util.velocity.VelocityUtils;
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import java.awt.Dimension;
import java.io.IOException;
import java.lang.reflect.Type;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;

public class MacroPreviewRenderer
extends HttpServlet {
    private static final long serialVersionUID = 1L;
    @Autowired
    private final IconRenderer iconRenderer;

    public MacroPreviewRenderer(IconRenderer iconRenderer) {
        this.iconRenderer = iconRenderer;
    }

    private String renderButton(Map<String, String> templateParams) {
        if (templateParams != null && templateParams.containsKey("icon") && templateParams.get("icon").length() > 0) {
            try {
                String icon = this.iconRenderer.renderIconByName(templateParams.get("icon"), templateParams.get("color"), new Dimension(12, 12));
                templateParams.put("renderedIconWithHtml", icon);
            }
            catch (Exception e) {
                e.printStackTrace();
            }
        }
        return VelocityUtils.getRenderedTemplate((String)String.format("/previews/%s.vm", "Button"), templateParams);
    }

    private String renderCards(Map<String, String> templateParams) {
        return VelocityUtils.getRenderedTemplate((String)String.format("/previews/%s.vm", "Cards"), templateParams);
    }

    private String renderDivider(Map<String, String> templateParams) {
        return VelocityUtils.getRenderedTemplate((String)String.format("/previews/%s.vm", "Divider"), templateParams);
    }

    protected void doGet(HttpServletRequest req, HttpServletResponse res) throws IOException {
        String templateName = req.getParameter("templateName");
        if (templateName == null) {
            res.sendError(404);
            return;
        }
        Map templateParams = null;
        String params = req.getParameter("params");
        if (params != null) {
            String gsonString = new String(Base64.getDecoder().decode(params));
            Gson gson = new Gson();
            Type gsonType = new TypeToken<HashMap<String, String>>(){}.getType();
            templateParams = (Map)gson.fromJson(gsonString, gsonType);
        }
        String previewImage = "";
        if (templateName.equals("Button")) {
            previewImage = this.renderButton(templateParams);
        } else if (templateName.equals("Cards")) {
            previewImage = this.renderCards(templateParams);
        } else if (templateName.equals("Divider")) {
            previewImage = this.renderDivider(templateParams);
        } else {
            res.sendError(404);
            return;
        }
        res.setContentType("image/svg+xml");
        res.getWriter().println(previewImage);
    }
}

