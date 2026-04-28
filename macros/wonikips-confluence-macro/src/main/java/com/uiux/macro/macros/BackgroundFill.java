/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.atlassian.confluence.content.render.xhtml.ConversionContext
 *  com.atlassian.confluence.macro.Macro
 *  com.atlassian.confluence.macro.Macro$BodyType
 *  com.atlassian.confluence.macro.Macro$OutputType
 *  com.atlassian.confluence.macro.MacroExecutionException
 */
package com.uiux.macro.macros;

import com.atlassian.confluence.content.render.xhtml.ConversionContext;
import com.atlassian.confluence.macro.Macro;
import com.atlassian.confluence.macro.MacroExecutionException;
import java.util.Map;

public class BackgroundFill
implements Macro {
    public String execute(Map<String, String> map, String body, ConversionContext conversionContext) throws MacroExecutionException {
        return String.format("<div style=\"background-color: %s !important; padding: 1rem;\"><div>%s</div></div>", map.containsKey("color") ? map.get("color") : "#eeeeee", body);
    }

    public Macro.BodyType getBodyType() {
        return Macro.BodyType.RICH_TEXT;
    }

    public Macro.OutputType getOutputType() {
        return Macro.OutputType.BLOCK;
    }
}

