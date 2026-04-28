/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.atlassian.confluence.api.model.Expansion
 *  com.atlassian.confluence.api.model.content.id.ContentId
 *  com.atlassian.confluence.api.model.link.Link
 *  com.atlassian.confluence.api.model.link.LinkType
 *  com.atlassian.confluence.api.service.content.ContentService
 *  com.atlassian.confluence.setup.settings.SettingsManager
 *  com.atlassian.plugin.spring.scanner.annotation.imports.ComponentImport
 *  com.atlassian.spring.container.ContainerManager
 *  org.springframework.stereotype.Component
 */
package com.uiux.macro.utility;

import com.atlassian.confluence.api.model.Expansion;
import com.atlassian.confluence.api.model.content.id.ContentId;
import com.atlassian.confluence.api.model.link.Link;
import com.atlassian.confluence.api.model.link.LinkType;
import com.atlassian.confluence.api.service.content.ContentService;
import com.atlassian.confluence.setup.settings.SettingsManager;
import com.atlassian.plugin.spring.scanner.annotation.imports.ComponentImport;
import com.atlassian.spring.container.ContainerManager;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.function.UnaryOperator;
import org.springframework.stereotype.Component;

@Component
public class ConfluenceLinkBuilder {
    private final Map<String, UnaryOperator<String>> TEMPLATES;
    private final Map<String, UnaryOperator<String>> ATTACHMENT_TEMPLATES;
    private final ContentService contentService;
    private final SettingsManager settingsManager;

    public ConfluenceLinkBuilder(@ComponentImport ContentService contentService) {
        this.contentService = contentService;
        this.settingsManager = (SettingsManager)ContainerManager.getComponent((String)"settingsManager");
        this.TEMPLATES = new HashMap<String, UnaryOperator<String>>();
        this.ATTACHMENT_TEMPLATES = new HashMap<String, UnaryOperator<String>>();
        this.setupTemplateConverters();
        this.setupAttachmentConverters();
    }

    private void setupAttachmentConverters() {
        this.ATTACHMENT_TEMPLATES.put("_", value -> "");
        this.ATTACHMENT_TEMPLATES.put("attachment", value -> {
            try {
                long id = Long.parseLong(value);
                Optional<Link> link = this.contentService.find(new Expansion[0]).withId(ContentId.of((long)id)).fetch().map(content -> (Link)content.getLinks().get(LinkType.DOWNLOAD));
                return String.valueOf(this.settingsManager.getGlobalSettings().getBaseUrl()) + link.orElseGet(() -> new Link(LinkType.DOWNLOAD, "")).getPath();
            }
            catch (Exception e) {
                return "";
            }
        });
        this.ATTACHMENT_TEMPLATES.put("link", value -> value);
        this.ATTACHMENT_TEMPLATES.put("aura-hosted", value -> {
            try {
                String baseUrl = this.settingsManager.getGlobalSettings().getBaseUrl();
                String basePath = "/download/resources/com.uiux.macro.aura";
                return String.valueOf(baseUrl) + basePath + value;
            }
            catch (Exception e) {
                return "";
            }
        });
    }

    private void setupTemplateConverters() {
        UnaryOperator<String> defaultConverter = value -> {
            try {
                long id = Long.parseLong(value);
                Optional<Link> link = this.contentService.find(new Expansion[0]).withId(ContentId.of((long)id)).fetch().map(content -> (Link)content.getLinks().get(LinkType.WEB_UI));
                return String.valueOf(this.settingsManager.getGlobalSettings().getBaseUrl()) + link.orElseGet(() -> new Link(LinkType.WEB_UI, "")).getPath();
            }
            catch (Exception e) {
                return "#";
            }
        };
        this.TEMPLATES.put("page", defaultConverter);
        this.TEMPLATES.put("blogpost", defaultConverter);
        this.TEMPLATES.put("attachment", defaultConverter);
        this.TEMPLATES.put("anchor", value -> "#" + value);
        this.TEMPLATES.put("link", value -> value.startsWith("http") ? String.format("%s", value) : String.format("http://%s", value));
        this.TEMPLATES.put("mail", value -> value.startsWith("mailto:") ? String.format("%s", value) : String.format("mailto:%s", value));
        this.TEMPLATES.put("_", value -> "#");
    }

    public String getUrl(String type, String href, boolean isMobile) {
        if (isMobile && type.equals("attachment")) {
            try {
                long id = Long.parseLong(href);
                Optional<Link> link = this.contentService.find(new Expansion[0]).withId(ContentId.of((long)id)).fetch().map(content -> (Link)content.getLinks().get(LinkType.DOWNLOAD));
                return String.valueOf(this.settingsManager.getGlobalSettings().getBaseUrl()) + link.orElseGet(() -> new Link(LinkType.DOWNLOAD, "")).getPath();
            }
            catch (Exception e) {
                return "#";
            }
        }
        return this.getUrl(type, href);
    }

    public String getUrl(String type, String href) {
        UnaryOperator<String> builder = this.TEMPLATES.containsKey(type) ? this.TEMPLATES.get(type) : this.TEMPLATES.get("_");
        return (String)builder.apply(href);
    }

    public String getAttachment(String type, String href) {
        UnaryOperator<String> builder = this.ATTACHMENT_TEMPLATES.containsKey(type) ? this.ATTACHMENT_TEMPLATES.get(type) : this.ATTACHMENT_TEMPLATES.get("_");
        return (String)builder.apply(href);
    }
}

