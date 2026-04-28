/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.atlassian.confluence.content.render.xhtml.ConversionContext
 *  com.atlassian.confluence.macro.Macro
 *  com.atlassian.confluence.macro.MacroExecutionException
 */
package com.uiux.macro.macros;

import com.atlassian.confluence.content.render.xhtml.ConversionContext;
import com.atlassian.confluence.macro.Macro;
import com.atlassian.confluence.macro.MacroExecutionException;
import java.util.Map;

public abstract class AbstractMultiOutputMacro
implements Macro {
    public String execute(Map<String, String> map, String s, ConversionContext context) throws MacroExecutionException {
        if (context.getOutputType().toLowerCase().equals("pdf")) {
            return this.executePDF(map, s, context);
        }
        return this.executeWeb(map, s, context);
    }

    public String executePDF(Map<String, String> map, String body, ConversionContext context) throws MacroExecutionException {
        return "";
    }

    public String executeWeb(Map<String, String> map, String body, ConversionContext context) throws MacroExecutionException {
        return "";
    }
}

