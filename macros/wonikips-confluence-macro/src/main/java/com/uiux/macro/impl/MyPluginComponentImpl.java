/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.atlassian.plugin.spring.scanner.annotation.export.ExportAsService
 *  com.atlassian.plugin.spring.scanner.annotation.imports.ComponentImport
 *  com.atlassian.sal.api.ApplicationProperties
 *  javax.inject.Inject
 *  javax.inject.Named
 */
package com.uiux.macro.impl;

import com.uiux.macro.api.MyPluginComponent;
import com.atlassian.plugin.spring.scanner.annotation.export.ExportAsService;
import com.atlassian.plugin.spring.scanner.annotation.imports.ComponentImport;
import com.atlassian.sal.api.ApplicationProperties;
import javax.inject.Inject;
import javax.inject.Named;

@ExportAsService(value={MyPluginComponent.class})
@Named(value="myPluginComponent")
public class MyPluginComponentImpl
implements MyPluginComponent {
    @ComponentImport
    private final ApplicationProperties applicationProperties;

    @Inject
    public MyPluginComponentImpl(ApplicationProperties applicationProperties) {
        this.applicationProperties = applicationProperties;
    }

    @Override
    public String getName() {
        if (this.applicationProperties != null) {
            return "myComponent:" + this.applicationProperties.getDisplayName();
        }
        return "myComponent";
    }
}

