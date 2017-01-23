#!/usr/bin/env python

import os
import SocketServer
import SimpleHTTPServer
import cookielib
import urllib
import urllib2

HOST = "https://working-dog-data-dash.appspot.com"

def create_opener():
    cj = cookielib.CookieJar()
    opener = urllib2.build_opener(urllib2.HTTPCookieProcessor(cj))
    return opener

class DevHTTPRequestHandler(SimpleHTTPServer.SimpleHTTPRequestHandler):
    opener = create_opener()

    def send_head(self):
        """Common code for GET and HEAD commands.

        This sends the response code and MIME headers.

        Return value is either a file object (which has to be copied
        to the outputfile by the caller unless the command was HEAD,
        and must be closed by the caller under all circumstances), or
        None, in which case the caller has nothing further to do.

        """
        if self.path == "/":
            self.path = "static/index.html"
        file_path = self.translate_path(self.path)
        f = None
        if os.path.isdir(file_path):
            if not self.path.endswith('/'):
                # redirect browser - doing basically what apache does
                self.send_response(301)
                self.send_header("Location", self.path + "/")
                self.end_headers()
                return None
            for index in "index.html", "index.htm":
                index = os.path.join(file_path, index)
                if os.path.exists(index):
                    file_path = index
                    break
            else:
                return self.list_directory(file_path)
        elif self.path.startswith("/api"):
            url = HOST + self.path
            response = DevHTTPRequestHandler.opener.open(url)
            self.send_response(response.getcode())
            headers = response.info()
            for header in headers:
                self.send_header(header, headers[header])
            self.end_headers()
            self.copyfile(response, self.wfile)
            """
            self.send_response(301)
            self.send_header("Access-Control-Allow-Origin", "*")
            remote_path = '%s%s'%('https://working-dog-data-dash.appspot.com', self.path)
            self.send_header('Location', remote_path)
            self.end_headers()
            """
            return
        ctype = self.guess_type(file_path)
        try:
            # Always read in binary mode. Opening files in text mode may cause
            # newline translations, making the actual size of the content
            # transmitted *less* than the content-length!
            f = open(file_path, 'rb')
        except IOError:
            self.send_error(404, "File not found")
            return None
        self.send_response(200)
        self.send_header("Content-type", ctype)
        fs = os.fstat(f.fileno())
        self.send_header("Content-Length", str(fs[6]))
        self.send_header("Last-Modified", self.date_time_string(fs.st_mtime))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        return f

def login(opener):
    login_url = HOST+"/login"
    print("please enter credentials for P.A.W.S.")
    user = raw_input("user: ")
    password = raw_input("password: ")
    form_data = {"username": user, "password": password}
    params = urllib.urlencode(form_data)
    response = opener.open(login_url, data=params)
    code = response.getcode()
    if code != 200:
        raise Exception("Failed to login!")

if __name__ == "__main__":
    port = 8080
    handler = DevHTTPRequestHandler
    httpd = SocketServer.TCPServer(("", port), handler)
    login(DevHTTPRequestHandler.opener)
    print "serving at localhost:%s"%(port)
    try:
        httpd.serve_forever()
    except:
        httpd.server_close()

