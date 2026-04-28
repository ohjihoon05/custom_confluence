package com.ohjih.button.macro;

import com.atlassian.confluence.content.render.xhtml.ConversionContext;
import com.atlassian.confluence.macro.Macro;
import com.atlassian.confluence.macro.MacroExecutionException;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.regex.Pattern;

public class ButtonMacro implements Macro {

    private static final Pattern HEX_COLOR = Pattern.compile("^#[0-9A-Fa-f]{6}$");
    private static final Set<String> ALLOWED_SIZES =
        new HashSet<>(Arrays.asList("small", "medium", "large"));
    private static final Set<String> ALLOWED_STYLES =
        new HashSet<>(Arrays.asList("filled", "outlined"));
    private static final Set<String> ALLOWED_ELEVATIONS =
        new HashSet<>(Arrays.asList("flat", "elevated"));
    private static final AtomicInteger COUNTER = new AtomicInteger(0);

    @Override
    public String execute(Map<String, String> params, String body, ConversionContext context)
            throws MacroExecutionException {

        String label      = escapeHtml(getParam(params, "label", "버튼"));
        String href       = getParam(params, "href", "");
        String target     = getParam(params, "target", "_self");
        String background = sanitizeColor(getParam(params, "background", "#0052CC"));
        String color      = sanitizeColor(getParam(params, "color", "#ffffff"));
        String size       = sanitizeEnum(getParam(params, "size", "medium"), ALLOWED_SIZES, "medium");
        String style      = sanitizeEnum(getParam(params, "style", "filled"), ALLOWED_STYLES, "filled");
        String elevation  = sanitizeEnum(getParam(params, "elevation", "flat"), ALLOWED_ELEVATIONS, "flat");
        int    radius     = sanitizeRadius(getParam(params, "borderRadius", "6"));

        // 페이지에 버튼 여러 개 있어도 CSS 충돌 방지
        String cls = "wip-btn-" + COUNTER.incrementAndGet();

        double mult   = size.equals("large") ? 1.7 : size.equals("medium") ? 1.35 : 1.0;
        int fontSize  = (int) (12 * mult);
        int paddingV  = (int) (8  * mult);
        int paddingH  = (int) (14 * mult);

        boolean isOutlined = style.equals("outlined");
        String bgCss     = isOutlined ? "transparent" : background;
        String fgCss     = isOutlined ? background    : color;
        String hoverBg   = isOutlined ? background    : "transparent";
        String hoverFg   = isOutlined ? color         : background;
        String shadow    = elevation.equals("elevated")
                           ? "box-shadow:0 0.2rem 0.5rem " + background + "99;" : "";

        StringBuilder sb = new StringBuilder();
        sb.append("<span style=\"display:inline-block;\">");
        sb.append("<style>");
        sb.append(".").append(cls).append("{")
          .append("display:inline-flex;align-items:center;justify-content:center;")
          .append("box-sizing:border-box;cursor:pointer;word-break:break-word;")
          .append("text-decoration:none !important;")
          .append("transition:background 0.3s,color 0.3s,border-color 0.3s;")
          .append("padding:").append(paddingV).append("px ").append(paddingH).append("px;")
          .append("font-size:").append(fontSize).append("px;")
          .append("border-radius:").append(radius).append("px;")
          .append("border:2px solid ").append(background).append(";")
          .append("background:").append(bgCss).append(";")
          .append("color:").append(fgCss).append(" !important;")
          .append(shadow)
          .append("}");
        sb.append(".").append(cls).append(":hover{")
          .append("background:").append(hoverBg).append(";")
          .append("color:").append(hoverFg).append(" !important;")
          .append("border-color:").append(background).append(";")
          .append("}");
        sb.append("</style>");

        if (!href.isEmpty()) {
            String safeHref   = escapeAttr(href);
            String safeTarget = "_blank".equals(target) ? "_blank" : "_self";
            sb.append("<a href=\"").append(safeHref).append("\"")
              .append(" class=\"").append(cls).append("\"")
              .append(" target=\"").append(safeTarget).append("\">");
        } else {
            sb.append("<a class=\"").append(cls).append("\">");
        }
        sb.append("<span>").append(label).append("</span>");
        sb.append("</a></span>");

        return sb.toString();
    }

    private String getParam(Map<String, String> params, String key, String def) {
        String v = params.get(key);
        return (v != null && !v.trim().isEmpty()) ? v.trim() : def;
    }

    private String sanitizeColor(String c) {
        return (c != null && HEX_COLOR.matcher(c).matches()) ? c : "#0052CC";
    }

    private int sanitizeRadius(String v) {
        try { int r = Integer.parseInt(v.trim()); return (r >= 0 && r <= 100) ? r : 6; }
        catch (NumberFormatException e) { return 6; }
    }

    private String sanitizeEnum(String v, Set<String> allowed, String def) {
        return (v != null && allowed.contains(v.trim().toLowerCase())) ? v.trim().toLowerCase() : def;
    }

    private String escapeHtml(String s) {
        if (s == null) return "";
        return s.replace("&","&amp;").replace("<","&lt;").replace(">","&gt;")
                .replace("\"","&quot;").replace("'","&#x27;");
    }

    private String escapeAttr(String s) {
        if (s == null) return "";
        return s.replace("\"","&quot;").replace("'","&#x27;").replace("<","").replace(">","");
    }

    @Override public BodyType getBodyType()   { return BodyType.NONE; }
    @Override public OutputType getOutputType() { return OutputType.INLINE; }
}
