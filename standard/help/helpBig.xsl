<?xml version="1.0" encoding="ISO-8859-1"?>

<xsl:stylesheet version="1.0"
	xmlns:xsl="http://www.w3.org/1999/XSL/Transform">


	<xsl:template match="/">
		<div id="short_content">
			<xsl:apply-templates select="page/body" />
			<xsl:apply-templates select="EWS/help_content/page/body" />
		</div>
	</xsl:template>


	<!--  h1 template-->
	<xsl:template match="h1">
		<h1>
			<xsl:apply-templates />
		</h1>
	</xsl:template>
	<!--  h2 template-->
	<xsl:template match="h2">
		<h2>
			<xsl:apply-templates />
		</h2>
	</xsl:template>
	<!--  h3 template-->
	<xsl:template match="h3">
		<h3>
			<xsl:apply-templates />
		</h3>
	</xsl:template>
	<!--  h4 template-->
	<xsl:template match="h4">
		<h4>
			<xsl:apply-templates />
		</h4>
	</xsl:template>
	<!--  h5 template-->
	<xsl:template match="h5">
		<h5>
			<xsl:apply-templates />
		</h5>
	</xsl:template>
	<!--  h6 template-->
	<xsl:template match="h6">
		<h6>
			<xsl:apply-templates />
		</h6>
	</xsl:template>
	<!--  br template-->
	<xsl:template match="br">
			<xsl:apply-templates />
		<br/>
	</xsl:template>
	<!--  pre template-->
	<xsl:template match="pre">
		<pre>
			<xsl:apply-templates />
		</pre>
	</xsl:template>
	<!--  span template-->
	<xsl:template match="span">
		<span>
			<xsl:apply-templates />
		</span>
	</xsl:template>
	<!--  p template-->
	<xsl:template match="p">
		<p>
			<xsl:apply-templates />
		</p>
	</xsl:template>
	<!--  address template-->
	<xsl:template match="address">
		<address>
			<xsl:apply-templates />
		</address>
	</xsl:template>
	<!--  ol template-->
	<xsl:template match="ol">
		<ol>
			<xsl:apply-templates />
		</ol>
	</xsl:template>
	<!--  ul template-->
	<xsl:template match="ul">
		<ul>
			<xsl:apply-templates />
		</ul>
	</xsl:template>
	<!--  li template-->
	<xsl:template match="li">
		<li>
			<xsl:attribute name="style">
				<xsl:value-of select="@style"></xsl:value-of>
			</xsl:attribute>
			<xsl:apply-templates />
		</li>
	</xsl:template>
	<!--  sub template-->
	<xsl:template match="sub">
		<sub>
			<xsl:apply-templates />
		</sub>
	</xsl:template>
	<!--  sup template-->
	<xsl:template match="sup">
		<sup>
			<xsl:apply-templates />
		</sup>
	</xsl:template>
	<!--  table template-->
	<xsl:template match="table">
		<table border="{@border}" width="{@width}"  align="{@align}" cellspacing="{@cellspacing}" cellpadding="{@cellpadding}" >
			<xsl:apply-templates />
		</table>
	</xsl:template>
	<!--  th template-->
	<xsl:template match="th">
		<th>
			<xsl:apply-templates />
		</th>
	</xsl:template>
	<!--  tr template-->
	<xsl:template match="tr">
		<tr>
			<xsl:apply-templates />
		</tr>
	</xsl:template>
	<!--  td template-->
	<xsl:template match="td">
		<td    valign="{@valign}" width="{@width}" height="{@height}" colspan="{@colspan}" rowspan="{@rowspan}">
			<xsl:apply-templates />
		</td>
	</xsl:template>
	<!--  b template-->
	<xsl:template match="b">
		<b>
			<xsl:apply-templates />
		</b>
	</xsl:template>
	<!--  i template-->
	<xsl:template match="i">
		<i>
			<xsl:apply-templates />
		</i>
	</xsl:template>
	<!--  img template-->
	<xsl:template match="img">
		<img>
			<xsl:attribute name="src">
				<xsl:text>km?mod=load&amp;service=getImg&amp;imgPath=</xsl:text>
				<xsl:value-of select="@src" />
			</xsl:attribute>
			<xsl:apply-templates />
		</img>
	</xsl:template>
	<!--  a template-->
	<xsl:template match="a">
		<a>
			
				<xsl:if test="starts-with(translate(@href, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'http') or starts-with(translate(@href, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'mailto:')">
		<xsl:attribute name="href">
			<xsl:value-of select="@href" />
			</xsl:attribute>
			<xsl:attribute name="target">
				<xsl:text>_blank</xsl:text>
			</xsl:attribute>
		</xsl:if>
		<xsl:if test="not(starts-with(translate(@href, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'http') or starts-with(translate(@href, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'mailto:'))">
			<!-- add url attribute for ajax link-->
			<xsl:attribute name="url">
				<xsl:value-of select="@href" />
			</xsl:attribute>
			<!--   register events on as-->			
			<xsl:attribute name="onclick">
				<xsl:text>
						ARINSO.KM.Container['Content'].getLink(event)
				</xsl:text>
			</xsl:attribute>
		</xsl:if>
			
			<xsl:apply-templates />
		</a>
	</xsl:template>

</xsl:stylesheet>
