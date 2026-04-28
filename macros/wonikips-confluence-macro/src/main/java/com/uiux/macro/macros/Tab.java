/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.atlassian.confluence.content.render.xhtml.ConversionContext
 *  com.atlassian.confluence.content.render.xhtml.storage.macro.MacroId
 *  com.atlassian.confluence.macro.Macro$BodyType
 *  com.atlassian.confluence.macro.Macro$OutputType
 *  com.atlassian.confluence.macro.MacroExecutionException
 *  com.atlassian.confluence.util.GeneralUtil
 *  com.atlassian.confluence.xhtml.api.MacroDefinition
 *  com.atlassian.fugue.Option
 */
package com.uiux.macro.macros;

import com.uiux.macro.macros.AbstractMultiOutputMacro;
import com.atlassian.confluence.content.render.xhtml.ConversionContext;
import com.atlassian.confluence.content.render.xhtml.storage.macro.MacroId;
import com.atlassian.confluence.macro.Macro;
import com.atlassian.confluence.macro.MacroExecutionException;
import com.atlassian.confluence.xhtml.api.MacroDefinition;
import java.util.Map;
import java.util.Optional;

public class Tab
extends AbstractMultiOutputMacro {
    @Override
    public String executePDF(Map<String, String> map, String body, ConversionContext context) throws MacroExecutionException {
        return String.format("<h5>%s</h5><p>%s</p>", map.getOrDefault("title", ""), body);
    }

    @Override
    public String executeWeb(Map<String, String> params, String body, ConversionContext ctx) throws MacroExecutionException {
        MacroDefinition macroDefinition = (MacroDefinition)ctx.getProperty("macroDefinition");
        String id = "";
        Optional<MacroId> optional = macroDefinition.getMacroIdentifier();
        MacroId macroId = optional.orElse(null);
        if (macroId != null) {
            id = macroId.getId();
        }
        return "<div hidden aria-labelledby=\"tab-" + id + "\" data-aura-tab-id=\"" + id + "\" role=\"tabpanel\" id=\"tabpanel-" + id + "\"data-aura-tab-icon=\"" + params.getOrDefault("icon", "") + "\" data-aura-tab-title=\"" + params.getOrDefault("title", "Tab Title") + "\">" + body + "</div>";
    }

    public Macro.BodyType getBodyType() {
        return Macro.BodyType.RICH_TEXT;
    }

    public Macro.OutputType getOutputType() {
        return Macro.OutputType.BLOCK;
    }
}

