package ut.com.ohjih.macro;

import com.ohjih.macro.PageTitleMacro;
import org.junit.Before;
import org.junit.Test;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

import static org.junit.Assert.*;

public class PageTitleMacroTest {

    private PageTitleMacro macro;

    @Before
    public void setUp() {
        macro = new PageTitleMacro();
    }

    // sanitizeColor
    @Test
    public void validHexColor_returnsSame() {
        assertEquals("#1A2B3C", macro.sanitizeColor("#1A2B3C"));
        assertEquals("#000000", macro.sanitizeColor("#000000"));
        assertEquals("#ffffff", macro.sanitizeColor("#ffffff"));
    }

    @Test
    public void invalidHexColor_returnsDefault() {
        assertEquals("#000000", macro.sanitizeColor("#xyz"));
        assertEquals("#000000", macro.sanitizeColor("red"));
        assertEquals("#000000", macro.sanitizeColor(""));
        assertEquals("#000000", macro.sanitizeColor(null));
        assertEquals("#000000", macro.sanitizeColor("#12345"));   // 5자리
        assertEquals("#000000", macro.sanitizeColor("#1234567")); // 7자리
    }

    // sanitizeFontSize
    @Test
    public void validFontSize_returnsSame() {
        assertEquals("48", macro.sanitizeFontSize("48"));
        assertEquals("12", macro.sanitizeFontSize("12"));
        assertEquals("96", macro.sanitizeFontSize("96"));
    }

    @Test
    public void invalidFontSize_returnsDefault() {
        assertEquals("48", macro.sanitizeFontSize("abc"));
        assertEquals("48", macro.sanitizeFontSize(""));
        assertEquals("48", macro.sanitizeFontSize("12.5"));
    }

    // sanitizeEnum
    @Test
    public void validHtmlTag_returnsSame() {
        HashSet<String> tags = new HashSet<>(Arrays.asList("h1","h2","h3","h4","h5","h6"));
        assertEquals("h1", macro.sanitizeEnum("h1", tags, "h1"));
        assertEquals("h3", macro.sanitizeEnum("H3", tags, "h1")); // case insensitive
    }

    @Test
    public void invalidHtmlTag_returnsDefault() {
        HashSet<String> tags = new HashSet<>(Arrays.asList("h1","h2","h3","h4","h5","h6"));
        assertEquals("h1", macro.sanitizeEnum("h7", tags, "h1"));
        assertEquals("h1", macro.sanitizeEnum("<script>", tags, "h1"));
        assertEquals("h1", macro.sanitizeEnum(null, tags, "h1"));
    }

    // HTML 이스케이프 (execute 레벨은 통합 테스트로, 여기선 기본 로직만)
    @Test
    public void sanitizeColor_cssInjectionAttempt_returnsDefault() {
        assertEquals("#000000", macro.sanitizeColor("red; background:url(evil)"));
        assertEquals("#000000", macro.sanitizeColor("#000; color:red"));
    }
}
