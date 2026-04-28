/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.atlassian.confluence.util.velocity.VelocityUtils
 *  com.atlassian.plugin.spring.scanner.annotation.imports.ComponentImport
 *  com.atlassian.sal.api.auth.LoginUriProvider
 *  com.atlassian.sal.api.user.UserManager
 *  com.atlassian.sal.api.user.UserProfile
 *  javax.inject.Inject
 *  javax.servlet.ServletException
 *  javax.servlet.http.HttpServlet
 *  javax.servlet.http.HttpServletRequest
 *  javax.servlet.http.HttpServletResponse
 */
package com.uiux.macro.servlets;

import com.atlassian.confluence.util.velocity.VelocityUtils;
import com.atlassian.plugin.spring.scanner.annotation.imports.ComponentImport;
import com.atlassian.sal.api.auth.LoginUriProvider;
import com.atlassian.sal.api.user.UserManager;
import com.atlassian.sal.api.user.UserProfile;
import java.io.IOException;
import java.net.URI;
import java.util.HashMap;
import javax.inject.Inject;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

public class AdminUI
extends HttpServlet {
    private static final long serialVersionUID = 1L;
    @ComponentImport
    private final UserManager userManager;
    @ComponentImport
    private final LoginUriProvider loginUriProvider;

    @Inject
    public AdminUI(UserManager userManager, LoginUriProvider loginUriProvider) {
        this.userManager = userManager;
        this.loginUriProvider = loginUriProvider;
    }

    public void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException, ServletException {
        String userName = this.userManager.getRemoteUsername(request);
        UserProfile user = null;
        if (userName != null) {
            user = this.userManager.getUserProfile(userName);
        }
        if (user == null || !this.userManager.isAdmin(userName)) {
            this.redirectToLogin(request, response);
            return;
        }
        String page = VelocityUtils.getRenderedTemplate((String)"templates/Admin.vm", new HashMap());
        response.setContentType("text/html;charset=utf-8");
        response.getWriter().println(page);
    }

    private void redirectToLogin(HttpServletRequest request, HttpServletResponse response) throws IOException {
        response.sendRedirect(this.loginUriProvider.getLoginUri(this.getUri(request)).toASCIIString());
    }

    private URI getUri(HttpServletRequest request) {
        StringBuffer builder = request.getRequestURL();
        if (request.getQueryString() != null) {
            builder.append("?");
            builder.append(request.getQueryString());
        }
        return URI.create(builder.toString());
    }
}

