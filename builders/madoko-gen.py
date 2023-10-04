#!python3

import sys
from pathlib import Path
from shutil import which
import subprocess
import argparse

with_pdf = False
with_debug = False
with_check = False
with_push = False

mdk_location = 'assets/mdk/'
src_location = 'assets/src/'
includes_location = '_includes/'

madoko = which('madoko')
if madoko is None:
    print('madoko could not be found')
    print('Please install madoko (npm install madoko -g)')
    exit()

dafny = which('dafny')
if dafny is None:
    print('Could not find dafny')
    print('Make sure that Dafny is in the PATH')
    exit(1)

def loadDafny(DFYfile):

    if with_debug:
        buff = '\t'
        print('Loading code for',DFYfile)

    path_dfy = Path(DFYfile)

    if not (path_dfy.is_file() and path_dfy.suffix == '.dfy'):
        print('Argument 2 should be a Dafny file', DFYfile)
        exit(1)    

    if with_check:
        if with_debug:
            print('Running Dafny on post', DFYfile)
            
        error_code = subprocess.run([dafny, 'verify', path_dfy]).returncode

        if error_code != 0:
            print('The Dafny file does not verify')
            exit(1)

    if with_debug:
        print(buff,'Extracting code from',path_dfy)
        
    file_in_dfy = open(path_dfy)
    modules = {}
    mod_name = None
    nested = False
    for line in file_in_dfy:
        if 'module' in line and not mod_name:
            mod_parse = line.split(' ')
            mod_name = mod_parse[1]
            modules[mod_name] = ''
            continue
        elif line == '}\n':
            mod_name = None
            nested = False
            continue
        elif 'import opened' in line and not nested:
            continue
        elif mod_name:
            modules[mod_name] += line.replace('{:termination false} ','')
        if 'module' in line:
            nested = True

    file_in_dfy.close()

    return modules

def GenerateHTMLFromPreMadoko(MDKfile):

    if with_debug:
        buff = '\t'
        print('Creating blog post for',MDKfile + '.mdk')

    path_mdk = Path(mdk_location + MDKfile + '.mdk')

    if not (path_mdk.is_file()):
        print('Expected a Madoko file but got', path_mdk)
        exit(1)

    file_in = open(path_mdk)
    path_out = mdk_location + path_mdk.stem + '_gen' + '.mdk'

    if with_debug:
        print(buff,'Inlining code into',path_out)

    file_out = open(path_out,'w')

    file_out.write('\n\n')
    file_out.write('<!-- This file was automatically generated from ' + path_mdk.stem + '.mdk -->\n')

    modules = {}
    for line in file_in:
        file_out.write(line)
        if 'inline-dafny' in line:
            dmodule = line.split(' ')[2]
            dmodule = dmodule.split('/')
            DFYfile = dmodule[0]
            if not DFYfile in modules:
                modules[DFYfile] = loadDafny(src_location + path_mdk.stem + '/' + DFYfile + '.dfy')
            dmodule = dmodule[1]
            if dmodule in modules[DFYfile]:
                file_out.write('\n``` dafny \n')
                file_out.write(modules[DFYfile][dmodule].replace('\t','  ').strip('\n') + '\n')
                file_out.write('```\n\n')
            else:
                print('Module not found: ', DFYfile + '/' + dmodule, 'for', MDKfile)
                exit(1)

    file_in.close()
    file_out.close() 

    if with_debug:
        print(buff,'Running Madoko to generate html from file', path_out)
        
    subprocess.run([madoko, '--odir=' + includes_location ,path_out])

def PostProcessGeneratedHTML(MDKfile):
    
    if with_debug:
        buff = '\t'
        print('Postprocessing generated HTML file...')

    path_in = Path(includes_location + MDKfile + '_gen.html')
    if not (path_in.is_file()):
        print('Generated HTML does not exist:', path_in)
        exit(1)    
    file_in = open(path_in)

    path_out = Path(includes_location + MDKfile + '.html')
    if with_debug:
        print(buff,'Inlining code into',path_out)
    file_out = open(path_out,'w')    

    first = True
    for line in file_in:    
        if first:
            first = False
            continue
        file_out.write(line)

    file_in.close()
    file_out.close()   

if __name__ == "__main__":

    parser = argparse.ArgumentParser(description='Generate course')
    parser.add_argument('post', metavar='POST', type=str,
                    help='Name of the Madoko file')
    parser.add_argument('--debug', dest='with_debug', action='store_const',
                    const=True, default=False,
                    help='Turn on debug mode')
    parser.add_argument('--check', dest='with_check', action='store_const',
                    const=True, default=False,
                    help='Turn on checking mode')

    args = parser.parse_args()
    globals().update(args.__dict__)

    GenerateHTMLFromPreMadoko(args.post)
    PostProcessGeneratedHTML(args.post)

    

