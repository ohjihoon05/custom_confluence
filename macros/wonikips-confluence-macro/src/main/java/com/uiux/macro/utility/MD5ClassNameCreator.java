/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.atlassian.plugin.spring.scanner.annotation.export.ExportAsService
 *  javax.inject.Named
 */
package com.uiux.macro.utility;

import com.uiux.macro.utility.ClassNameCreator;
import com.atlassian.plugin.spring.scanner.annotation.export.ExportAsService;
import java.math.BigInteger;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Map;
import javax.inject.Named;

@ExportAsService(value={ClassNameCreator.class})
@Named(value="ClassNameCreator")
public class MD5ClassNameCreator
implements ClassNameCreator {
    @Override
    public String createClassName(String basename, Map<String, String> attributes) {
        String hash = String.valueOf(Math.random());
        try {
            String attrs = attributes.toString();
            MessageDigest md = null;
            md = MessageDigest.getInstance("MD5");
            byte[] messageDigest = md.digest(attrs.getBytes());
            BigInteger no = new BigInteger(1, messageDigest);
            hash = no.toString(16);
        }
        catch (NoSuchAlgorithmException noSuchAlgorithmException) {
            // empty catch block
        }
        return String.format("%s-%s", basename, hash.substring(0, 16));
    }
}

