<%@ Page Language="VB" AspCompat="true" ValidateRequest="false" %>
<%  
    Response.Buffer = True
    'Creating the XMLHttp object
    Dim xml = Server.CreateObject("Microsoft.XMLHTTP")
    'Getting the URL GET parameter
    Dim strArr(Request.InputStream.Length) As Byte
    Dim keys = Request.Form.AllKeys()
    Request.InputStream.Read(strArr, 0, Request.InputStream.Length)
    'set the encoding to UTF8
    Dim xml_in = UTF8Encoding.UTF8.GetString(strArr)
    
    
    Dim url = Request.QueryString("url")
    'Opening the URL
    xml.Open("POST", url, False)
    xml.setRequestHeader("Content-type", "application/x-www-form-urlencoded")
    xml.Send(xml_in.ToString)
    Dim headerKeys = Request.Headers.AllKeys()
    Dim text = xml.ResponseText
    Response.ContentType = "text/xml"
    Response.HeaderEncoding = System.Text.Encoding.GetEncoding("utf-8")
    Response.Write(text)
    xml = Nothing
        
%>