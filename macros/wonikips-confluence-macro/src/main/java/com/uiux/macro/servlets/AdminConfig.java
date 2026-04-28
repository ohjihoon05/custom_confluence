/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.atlassian.bandana.BandanaContext
 *  com.atlassian.bandana.BandanaManager
 *  com.atlassian.confluence.setup.bandana.ConfluenceBandanaContext
 *  com.atlassian.plugin.spring.scanner.annotation.imports.ComponentImport
 *  com.atlassian.plugin.spring.scanner.annotation.imports.ConfluenceImport
 *  com.atlassian.sal.api.user.UserManager
 *  com.atlassian.sal.api.user.UserProfile
 *  com.google.gson.Gson
 *  javax.inject.Inject
 *  javax.servlet.ServletException
 *  javax.servlet.http.HttpServlet
 *  javax.servlet.http.HttpServletRequest
 *  javax.servlet.http.HttpServletResponse
 */
package com.uiux.macro.servlets;

import com.atlassian.bandana.BandanaContext;
import com.atlassian.bandana.BandanaManager;
import com.atlassian.confluence.setup.bandana.ConfluenceBandanaContext;
import com.atlassian.plugin.spring.scanner.annotation.imports.ComponentImport;
import com.atlassian.plugin.spring.scanner.annotation.imports.ConfluenceImport;
import com.atlassian.sal.api.user.UserManager;
import com.atlassian.sal.api.user.UserProfile;
import com.google.gson.Gson;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.function.Consumer;
import javax.inject.Inject;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

public class AdminConfig
extends HttpServlet {
    private static final long serialVersionUID = 1L;
    public static final String PERSISTENCE_KEY = "APPANVIL_AURA_ADMIN_CONFIG";
    @ComponentImport
    private final UserManager userManager;
    @ConfluenceImport
    private final BandanaManager bandanaManager;
    private final Config fallbackConfig;

    @Inject
    public AdminConfig(UserManager userManager, BandanaManager bandanaManager) {
        this.userManager = userManager;
        this.bandanaManager = bandanaManager;
        ColorPaletteOption auraPalette = new ColorPaletteOption();
        auraPalette.setActive(true);
        auraPalette.setId("0");
        auraPalette.setName("Aura");
        auraPalette.setPalette(Arrays.asList("#000038", "#0139D5", "#0385E7", "#B01EC1", "#DF1183", "#E13566", "#EC6541", "#F8AD11"));
        ColorPaletteOption defaultPalette = new ColorPaletteOption();
        defaultPalette.setActive(true);
        defaultPalette.setId("1");
        defaultPalette.setName("Default");
        defaultPalette.setPalette(Arrays.asList("#0065ff", "#0049b0", "#344563", "#f3f3f3", "#e2e2e2", "#d0d0d0"));
        ColorPaletteOption pastelPalette = new ColorPaletteOption();
        pastelPalette.setActive(true);
        pastelPalette.setId("2");
        pastelPalette.setName("Pastel");
        pastelPalette.setPalette(Arrays.asList("#ee5253", "#f79f1f", "#f9ca24", "#bac961", "#81ecec", "#66afff", "#918aff", "#fd79a8"));
        ColorPaletteOption statusPalette = new ColorPaletteOption();
        statusPalette.setActive(true);
        statusPalette.setId("3");
        statusPalette.setName("Status");
        statusPalette.setPalette(Arrays.asList("#dfe1e5", "#de350b", "#ffab00", "#00875a", "#b3d4ff", "#0052cc"));
        ArrayList<ColorPaletteOption> colorPalettes = new ArrayList<ColorPaletteOption>();
        colorPalettes.add(defaultPalette);
        colorPalettes.add(auraPalette);
        colorPalettes.add(pastelPalette);
        colorPalettes.add(statusPalette);
        this.fallbackConfig = new Config();
        this.fallbackConfig.setAllowColorPicker(true);
        this.fallbackConfig.setColors(colorPalettes);
    }

    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        String config = (String)this.bandanaManager.getValue((BandanaContext)new ConfluenceBandanaContext(), PERSISTENCE_KEY);
        Gson gson = new Gson();
        Consumer<HttpServletResponse> sendDefault = res -> {
            try {
                String defaultSerialized = gson.toJson((Object)this.fallbackConfig, Config.class);
                res.setContentType("application/json");
                res.setStatus(200);
                res.getWriter().write(defaultSerialized);
            }
            catch (IOException e) {
                e.printStackTrace();
            }
        };
        if (config == null) {
            sendDefault.accept(response);
            return;
        }
        try {
            Config cfg = (Config)gson.fromJson(config, Config.class);
            if (cfg == null || cfg.colors == null || cfg.colors.size() == 0) {
                sendDefault.accept(response);
                return;
            }
            response.setContentType("application/json");
            response.setStatus(200);
            response.getWriter().write(config);
            return;
        }
        catch (Exception e) {
            sendDefault.accept(response);
            return;
        }
    }

    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        String userName = this.userManager.getRemoteUsername(request);
        UserProfile user = null;
        if (userName != null) {
            user = this.userManager.getUserProfile(userName);
        }
        if (user == null || !this.userManager.isAdmin(userName)) {
            response.sendError(401);
            return;
        }
        String body = request.getReader().lines().map(String::trim).reduce("", String::concat);
        try {
            Gson gson = new Gson();
            gson.fromJson(body, Config.class);
            this.bandanaManager.setValue((BandanaContext)new ConfluenceBandanaContext(), PERSISTENCE_KEY, (Object)body);
            response.setStatus(200);
        }
        catch (Exception e) {
            response.setStatus(400);
        }
    }

    private class ColorPaletteOption {
        private List<String> palette;
        private String name;
        private boolean active;
        private String id;

        private ColorPaletteOption() {
        }

        public List<String> getPalette() {
            return this.palette;
        }

        public String getName() {
            return this.name;
        }

        public boolean isActive() {
            return this.active;
        }

        public String getId() {
            return this.id;
        }

        public void setPalette(List<String> palette) {
            this.palette = palette;
        }

        public void setName(String name) {
            this.name = name;
        }

        public void setActive(boolean active) {
            this.active = active;
        }

        public void setId(String id) {
            this.id = id;
        }
    }

    private class Config {
        private boolean allowColorPicker;
        private List<ColorPaletteOption> colors;

        private Config() {
        }

        public void setAllowColorPicker(boolean allowColorPicker) {
            this.allowColorPicker = allowColorPicker;
        }

        public boolean isAllowColorPicker() {
            return this.allowColorPicker;
        }

        public List<ColorPaletteOption> getColors() {
            return this.colors;
        }

        public void setColors(List<ColorPaletteOption> colors) {
            this.colors = colors;
        }
    }
}

