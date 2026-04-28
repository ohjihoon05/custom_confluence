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
 */
package com.uiux.macro.macros;

import com.uiux.macro.servlets.IconRenderer;
import com.atlassian.confluence.content.render.xhtml.ConversionContext;
import com.atlassian.confluence.macro.Macro;
import com.atlassian.confluence.macro.MacroExecutionException;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;

public class Icon
implements Macro {
    @Autowired
    private final IconRenderer iconRenderer;

    public Icon(IconRenderer iconRenderer) {
        this.iconRenderer = iconRenderer;
    }

    public String execute(Map<String, String> map, String s, ConversionContext conversionContext) throws MacroExecutionException {
        if (map.containsKey("color") && map.containsKey("name")) {
            try {
                this.iconRenderer.renderIconByName(map.get("name"), map.get("color"), null);
            }
            catch (Exception exception) {
                // empty catch block
            }
        }
        return "";
    }

    public Macro.BodyType getBodyType() {
        return Macro.BodyType.NONE;
    }

    public Macro.OutputType getOutputType() {
        return Macro.OutputType.INLINE;
    }
}

