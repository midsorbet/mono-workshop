package com.lawrencek0.lsclone.args;

import com.beust.jcommander.IParameterValidator;
import com.beust.jcommander.ParameterException;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;

public class ValidDirectory implements IParameterValidator {
    @Override
    public void validate(String name, String value) throws ParameterException {
        Path file = new File(value).toPath();
        if (!(Files.isDirectory(file) || Files.isRegularFile(file))) {
            throw new ParameterException("cannot access '" + value + "': No such file or directory");
        }
    }
}
